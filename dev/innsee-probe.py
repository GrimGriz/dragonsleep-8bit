"""The Halfway Inn's see-through by the party's presence, by its pixels (11-11, the inn seat; his notes: the chimney "when the players walk the squares behind it",
the front door's cutaway RULED 11-10, his question 5 "the parties presence should determine transparency and wouldn't need outline?"). The benches fetch no images,
so this draws the inn's own floors in headless Chromium with their art (deep16/?innshow's beats, the page beside deep16/index.html so the art resolves) and reads the
canvas: how much of the token's figure shows where it stands -- its pixels drawn against the same frame without it, over the same with no inn piece on the floor at all
(1.0: wholly seen; a roof over it, near 0). js/innprops.js IP.tick, IP.drawSee; mode=inn1111 is the floor's side. Quick gate (dev/check.py QUICK_SCRIPTS).
  python dev/innsee-probe.py"""
import json, os, re, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); import bench16
EDGE = bench16.browser()
# the cases: [beat, the token's square, what is asked]
CASES = [
    ['door', [18, 18], 'at the front step, the cutaway on: the figure seen under the house\'s west end'],
    ['door', [11, 18], 'seven squares out on the road: no cutaway'],
    ['room', [27, 18], 'inside, behind the big fire\'s chimney (its west side): the stack faint'],
    ['room', [24, 17], 'inside, in front of it: the stack whole'],
    ['upstairs', [9, 6], 'upstairs, behind the stack (the one square behind it): the stack faint'],
    ['yard', [27, 12], 'the yard by day, a square off the house\'s north wall: a window in the roof round the figure'],
    ['yard', [25, 26], 'the yard by day, in front of the house\'s south wall: no window'],
]
JS = r"""<script>
window.onerror = function (m, s, l) { var p = document.createElement('pre'); p.textContent = 'LOADERR ' + m + ' @ ' + s + ':' + l; document.body.appendChild(p); };
var D = window.D16; D.initCanvas(); if (D.audio) D.audio.musicVol = 0; D.music = function () { };
var CASES = %s, out = [];
function grab() { D.draw(); var c = D.canvas; return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; }
function diff(a, b) { var n = 0; for (var i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 36) n++; return n; }
D.loadImages(D.spr.images(), function () {
  setTimeout(function () {
    var pn = performance.now.bind(performance);
    CASES.forEach(function (cs) {
      try {
        D.scenes.length = 0; D.push(D.inn.show('?innshow&beat=' + cs[0])); for (var i = 0; i < 60; i++) D.update();
        var B = D.battle, t = B.roam.token; t.x = cs[1][0]; t.y = cs[1][1]; t.tween = null; B.roam.path = null; B.cards = []; D.grid.setup(B.map, B.units);
        for (var i2 = 0; i2 < 20; i2++) D.update(); B.cards = [];
        D.iso.lookAt(t.x - 1.5, t.y - 1.5, 0);
        var S = D.innprops.seeing || { figs: [], cut: null, groups: [] }, st ={ figs: S.figs.map(function (f) { return f.u.name; }), cut: S.cut, hide: S.groups.filter(function (g) { return g.hide; }).map(function (g) { return g.name; }) };
        performance.now = function () { return 5000; }; // (the flames and the floats held still between the frames)
        var k = B.units.indexOf(t), A = grab(), noise = diff(A, grab());
        B.units.splice(k, 1); var A0 = grab(); B.units.splice(k, 0, t);
        var m = D.iso.map, props = m.props; m.props = props.filter(function (p) { return !p.innProp; }); m.sorted = null;
        var C = grab(); B.units.splice(k, 1); var C0 = grab(); B.units.splice(k, 0, t);
        m.props = props; m.sorted = null; performance.now = pn;
        var seen = diff(A, A0), whole = diff(C, C0);
        out.push({ beat: cs[0], at: cs[1], seen: seen, whole: whole, frac: whole ? seen / whole : 0, noise: noise, st: st });
      } catch (e) { out.push({ beat: cs[0], at: cs[1], err: String(e && e.stack || e).slice(0, 400) }); }
    });
    var p = document.createElement('pre'); p.textContent = 'INNSEE ' + JSON.stringify(out); document.body.appendChild(p);
  }, 2500);
});
</script>"""


def main():
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
    page = os.path.join(ROOT, 'deep16', '_innsee-probe-%d.html' % os.getpid())
    open(page, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="480" height="270" tabindex="0"></canvas>\n' + '\n'.join(tags) + '\n' + (JS % json.dumps(CASES)) + '\n</body></html>')
    prof = os.path.join(tempfile.gettempdir(), 'deep16-innsee-%d' % os.getpid())
    cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA + ['--user-data-dir=' + prof,
           '--virtual-time-budget=40000', '--window-size=1300,800', '--dump-dom', 'file:///' + page.replace('\\', '/')]
    try:
        dom = subprocess.run(cmd, capture_output=True, timeout=300).stdout.decode('utf-8', 'replace')
    finally:
        try: os.remove(page)
        except OSError: pass
        shutil.rmtree(prof, ignore_errors=True)
    m = re.search(r'INNSEE (\[.*\])', dom, re.S)
    if not m:
        print('FAIL no result', re.findall(r'LOADERR [^<]*', dom)[:3]); print('no result'); return 1
    import html as H
    rows = json.loads(H.unescape(m.group(1))); bad = 0
    def ok(what, v):
        nonlocal bad
        print(('ok   ' if v else 'FAIL ') + what); bad += 0 if v else 1
    by = {(r['beat'], tuple(r['at'])): r for r in rows}
    for r in rows:
        if r.get('err'): ok('%s at %s: %s' % (r['beat'], r['at'], r['err']), False)
    def row(b, a): return by.get((b, a)) or {'frac': 0, 'st': {}, 'seen': 0, 'whole': 0, 'noise': -1}
    def say(r): return 'seen %.2f of the figure (%d of %d px, noise %d), the look %s' % (r['frac'], r['seen'], r['whole'], r['noise'], json.dumps(r.get('st')))
    ok('the frames held still (no pixel changes between two draws of one frame): ' + ', '.join('%s %s' % (r['beat'], r['noise']) for r in rows), all(r.get('noise') == 0 for r in rows))
    r = row('door', (18, 18)); ok(CASES[0][2] + ': ' + say(r), r['frac'] >= 0.3 and r['st'].get('cut') is True)
    r = row('door', (11, 18)); ok(CASES[1][2] + ': ' + say(r), r['st'].get('cut') is False)
    r = row('room', (27, 18)); ok(CASES[2][2] + ': ' + say(r), r['frac'] >= 0.3 and r['st'].get('hide') == ['inn_hearth'])
    r = row('room', (24, 17)); ok(CASES[3][2] + ': ' + say(r), r['frac'] >= 0.9 and r['st'].get('hide') == [])
    r = row('upstairs', (9, 6)); ok(CASES[4][2] + ': ' + say(r), r['frac'] >= 0.85 and r['st'].get('hide') == ['up_chimney'])
    r = row('yard', (27, 12)); ok(CASES[5][2] + ': ' + say(r), r['frac'] >= 0.3 and r['st'].get('figs') == ['Barley'])
    r = row('yard', (25, 26)); ok(CASES[6][2] + ': ' + say(r), r['frac'] >= 0.9 and r['st'].get('figs') == [])
    print('\n' + ('RED  %d' % bad if bad else 'GREEN'))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
