"""dev/ (gitignored): the tester camp headless -- two screenshots (PREPARE row, TORCH row) to dev/shots/camp-*.png.
  python dev/camp-shot.py [level] [ours|main]"""
import base64, os, re, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
lvl = sys.argv[1] if len(sys.argv) > 1 else '3'
who = sys.argv[2] if len(sys.argv) > 2 else 'ours'
html = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
tags = []
for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
    src, body = m.group(1), m.group(2)
    if src:
        src = src.split('?')[0]
        if src.endswith('js/main.js'):
            continue
        tags.append('<script src="%s"></script>' % src)  # (the page sits in deep16/ beside index.html, so its own paths and images resolve; removed after)
    else:
        tags.append('<script>%s</script>' % body)
test = """<script>
window.onerror = function (m, s, l) { var p = document.createElement('pre'); p.textContent = 'LOADERR ' + m + ' @ ' + s + ':' + l; document.body.appendChild(p); };
var D = window.D16; D.initCanvas();
D.loadImages(D.spr.images(), function () {
  if (%s) D.touch = true;
  var lad = new D.Ladder({ party: '%s' === 'ours' ? 'ours' : null }); D.push(lad); lad.fight(%s);
  function shot(sel, tag, at) { setTimeout(function () { var c = D.top(); c.sel = sel; for (var i = 0; i < 40; i++) D.update(); D.draw(); setTimeout(function () { var p = document.createElement('pre'); p.textContent = 'SHOT ' + tag + ' ' + D.canvas.toDataURL('image/png'); document.body.appendChild(p); }, 400); }, at); }
  shot(1, 'prepare', 1500); shot(3, 'torch', 3000);
  setTimeout(function () { var p = document.createElement('pre'); p.textContent = 'DONE ' + (D.lastError || ''); document.body.appendChild(p); }, 4500);
});
</script>""" % ('true' if 'touch' in sys.argv else 'false', who, lvl)
page = os.path.join(ROOT, 'deep16', '_camp-shot.html')
open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="480" height="270" tabindex="0"></canvas>\n' + '\n'.join(tags) + '\n' + test + '\n</body></html>')
prof = os.path.join(tempfile.gettempdir(), 'deep16-campshot-%d' % os.getpid())
cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof,
       '--virtual-time-budget=9000', '--window-size=1000,700', '--dump-dom', 'file:///' + page.replace('\\', '/')]
dom = subprocess.run(cmd, capture_output=True, timeout=120).stdout.decode('utf-8', 'replace')
os.remove(page)
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True)
for tag, b in re.findall(r'SHOT (\w+) data:image/png;base64,([A-Za-z0-9+/=]+)', dom):
    open(os.path.join(HERE, 'shots', 'camp-%s-%s.png' % (who, tag)), 'wb').write(base64.b64decode(b)); print('wrote', tag)
print(re.findall(r'(?:LOADERR|DONE)[^<]*', dom))
