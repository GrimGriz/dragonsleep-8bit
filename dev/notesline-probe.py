"""situations.html keeps a note made elsewhere (11-21, the shows-notes seat -- Griz on Sylvia's card eyes-ambush-r1-1111, "note disappeared again."):
situations.html wrote back the whole store it read when it opened, so a note typed since on Sylvia's card (js/tour.js) or in the gallery -- another tab,
the same device, the same store -- was wiped by the next verdict or note on the page. This opens situations.html in a frame (a fresh profile), writes a
card's note into the store as her bar does once the page is up, marks a verdict on the page's first row, and reads the store: both kept.
GREEN or RED; dev/check.py runs it in the quick gate."""
import os, re, sys, subprocess, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

PAGE = r'''<!doctype html><html><head><meta charset="utf-8"></head><body>
<iframe id="f" src="../situations.html?notesprobe=1" style="width:900px;height:700px"></iframe>
<script>
var out = function (o) { var p = document.createElement('pre'); p.id = 'out'; p.textContent = 'NOTESPROBE ' + JSON.stringify(o); document.body.appendChild(p); };
document.getElementById('f').addEventListener('load', function () {
  try {
    var K = 'dsl-situations-feedback:v1', w = document.getElementById('f').contentWindow, d = w.document;
    localStorage.removeItem(K); // (the page opened on an empty store)
    var fb = {}; fb['eyes-card-elsewhere-1121'] = { v: 'broken', note: 'typed on her card after the page opened', at: new Date().toISOString() };
    localStorage.setItem(K, JSON.stringify(fb)); // (her bar, in another tab: the page here holds what it read when it opened)
    setTimeout(function () {
      var b = d.querySelector('.item .chips button'); if (!b) { out({ err: 'no verdict chip on the page' }); return; }
      var id = b.closest('.item').getAttribute('data-id'); b.click();
      setTimeout(function () {
        var s = JSON.parse(localStorage.getItem(K) || '{}');
        out({ id: id, mine: !!(s[id] && s[id].v), card: (s['eyes-card-elsewhere-1121'] || {}).note || '' });
      }, 50);
    }, 50);
  } catch (e) { out({ err: String(e) }); }
});
</script></body></html>'''


def main():
    page = os.path.join(HERE, 'notesline-probe-%d.html' % os.getpid())
    open(page, 'w', encoding='utf-8').write(PAGE)
    prof = os.path.join(tempfile.gettempdir(), 'notesline-probe-%d' % os.getpid())
    try:
        p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--virtual-time-budget=8000'] + bench16.EXTRA +
                           ['--user-data-dir=' + prof, '--dump-dom', 'file:///' + page.replace('\\', '/')], capture_output=True, timeout=120)
    finally:
        try: os.remove(page)
        except OSError: pass
        shutil.rmtree(prof, ignore_errors=True)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'NOTESPROBE (\{.*?\})</pre>', dom, re.S)
    if not m:
        print('RED  notesline-probe: no result'); return 1
    import json, html as H
    r = json.loads(H.unescape(m.group(1)))
    good = not r.get('err') and r.get('mine') and r.get('card') == 'typed on her card after the page opened'
    print(('GREEN' if good else 'RED  ') + ' situations.html keeps a card note written after it opened: the page\'s verdict on %s kept %s, the card\'s note "%s"%s' % (r.get('id'), r.get('mine'), r.get('card'), (' -- ' + r['err']) if r.get('err') else ''))
    return 0 if good else 1


if __name__ == '__main__':
    sys.exit(main())
