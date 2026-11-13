"""The Walking Old One's cut, headless (the ripples-fight seat, 11-13, after dev/solskaft-shot.py): deep16/?ripplesshow stepped by hand, the canvas shot at the frames
named, to dev/shots/ripples-<tag>-<frame>.png and one sheet of them all, dev/shots/ripples-<tag>.png.
  python dev/ripples-shot.py [query] [tag] [frames]     query: 'hero' or 'first' (he wins the initiative); frames: 'a,b,c' or 'from:to:step' in updates after the title card
For a worktree that can't be served (dev/bench16.py's browser, the page beside deep16/index.html so its art resolves; removed after)."""
import base64, io, os, re, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); import bench16; EDGE = bench16.browser()
query = sys.argv[1] if len(sys.argv) > 1 else 'hero'
tag = sys.argv[2] if len(sys.argv) > 2 else query
if query == 'hero': query = '' # (PowerShell drops an empty argument: 'hero' is the plain door)
fr = sys.argv[3] if len(sys.argv) > 3 else '60:1200:60'
frames = list(range(*[int(v) for v in fr.split(':')])) if ':' in fr else [int(v) for v in fr.split(',')]
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
var FR = %s, Q = '%s';
D.loadImages(D.spr.images(), function () {
  D.seed = 1113; D.push(D.ripples.make('?ripplesshow' + (Q ? '&' + Q : '')));
  var B = D.top(), names = ['pt_lymen_full', 'pt_vivian_full', 'pt_aurdin_red_full', 'pt_aurdin_ochre_full', 'pt_barley_coat_full', 'ripples_blend_p1'];
  if (D.spr.ensure) D.spr.ensure(names.concat(B.units.map(function (u) { return u.sheet; })));
  setTimeout(function () {
    var out = function (s) { var p = document.createElement('pre'); p.textContent = s; document.body.appendChild(p); };
    try {
      for (var i = 0; i < 30; i++) { D.update(); if (B.req && B.req.entry) B.answer(); }
      var n = 0, last = FR[FR.length - 1];
      for (var f = 0; f <= last; f++) {
        D.update();
        if (FR.indexOf(f) >= 0) { D.draw(); out('SHOT ' + f + ' ' + D.canvas.toDataURL('image/png')); n++; }
      }
      var T = D.top();
      out('DONE shots=' + n + ' top=' + (T && T.kind) + ' log=' + JSON.stringify(B.ripplesLog || []) + ' order=' + JSON.stringify((B.order || []).map(function (u) { return u.name + ' ' + u.initRoll; })) + ' eyes=' + JSON.stringify(B.units.map(function (u) { return u.name + ':' + !!u.mirrorEye; })) + ' shown=' + JSON.stringify(T && T.shown || null));
    } catch (e) { out('LOADERR ' + String(e && e.stack || e)); }
  }, 2500);
});
</script>""" % (frames, query)
page = os.path.join(ROOT, 'deep16', '_ripples-shot-%d.html' % os.getpid())
open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="480" height="270" tabindex="0"></canvas>\n' + '\n'.join(tags) + '\n' + test + '\n</body></html>')
prof = os.path.join(tempfile.gettempdir(), 'deep16-rpshot-%d' % os.getpid())
cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof,
       '--virtual-time-budget=15000', '--window-size=1300,800', '--dump-dom', 'file:///' + page.replace('\\', '/')]
try:
    dom = subprocess.run(cmd, capture_output=True, timeout=300).stdout.decode('utf-8', 'replace')
finally:
    os.remove(page)
    import shutil; shutil.rmtree(prof, ignore_errors=True)
os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True)
got = re.findall(r'SHOT (\d+) data:image/png;base64,([A-Za-z0-9+/=]+)', dom)
try:
    from PIL import Image, ImageDraw
    ims = [(f, Image.open(io.BytesIO(base64.b64decode(b))).convert('RGB')) for f, b in got]
    if ims:
        cols = 4; w, h = 480, 270; rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))
        for k, (f, im) in enumerate(ims):
            im = im.resize((w, h), Image.NEAREST); ImageDraw.Draw(im).text((4, 4), 'f' + f, fill=(255, 255, 0))
            sheet.paste(im, ((k % cols) * w, (k // cols) * h))
        out = os.path.join(HERE, 'shots', 'ripples-%s.png' % tag); sheet.save(out); print('wrote', out, len(ims), 'frames')
except ImportError:
    for f, b in got:
        out = os.path.join(HERE, 'shots', 'ripples-%s-%s.png' % (tag, f)); open(out, 'wb').write(base64.b64decode(b)); print('wrote', out)
print(re.findall(r'(?:LOADERR|DONE)[^<]*', dom))
