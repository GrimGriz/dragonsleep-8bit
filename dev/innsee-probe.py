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
    // THE SEE-THROUGH FIXES OF 11-12 (the inn seat): the wagon faint in a fight and while it hides the party; the roofs' far slope laid whole; the cutaway's stubs a
    // square more each way; the outer walls' stubs in a hidden figure's window
    var X = {}, IP = D.innprops;
    try {
      var alphaOf = function (p) { var seen = [], fx = { globalAlpha: 1, save: function () { }, restore: function () { fx.globalAlpha = 1; }, drawImage: function () { seen.push(fx.globalAlpha); } }; p.draw(fx); return seen.length ? seen[0] : null; };
      var put = function (B, q) { var t = B.roam.token; t.x = q[0]; t.y = q[1]; t.tween = null; B.roam.path = null; D.grid.setup(B.map, B.units); for (var i = 0; i < 4; i++) D.update(); D.roam.occlude(B); };
      D.scenes.length = 0; D.push(D.inn.show('?innshow&beat=wagonyard')); for (var i = 0; i < 60; i++) D.update();
      var Bw = D.battle, mw = D.iso.map, wag = mw.props.filter(function (p) { return p.piece === 'yard_wagonT'; }), rim = mw.props.filter(function (p) { return p.piece === 'yard_wagonRim'; }), WA = D.inn.WAGONAT;
      put(Bw, [WA[0] + 1, WA[1] + 4]); X.wag = wag.length; X.rim = rim.length; X.walk = wag.length ? alphaOf(wag[0]) : null;
      var mode0 = Bw.roam.mode; Bw.roam.mode = 'fight'; X.fight = wag.length ? alphaOf(wag[0]) : null; X.fightRim = rim.length ? alphaOf(rim[0]) : null; Bw.roam.mode = mode0;
      X.hidAt = null; [[WA[0] + 1, WA[1] - 1], [WA[0] + 2, WA[1] - 1], [WA[0], WA[1] - 1], [WA[0] + 3, WA[1] - 1], [WA[0] + 1, WA[1] - 2], [WA[0] - 1, WA[1]], [WA[0] - 1, WA[1] - 1]].forEach(function (q) { if (X.hidAt || !D.grid.canStand(Bw.roam.token, q[0], q[1])) return; put(Bw, q); if (IP.wagonHid && IP.wagonHid()) X.hidAt = q; });
      X.hid = X.hidAt && wag.length ? alphaOf(wag[0]) : null; X.see = IP.SEE;
      X.flat = {}; IP.PARTS().forEach(function (pt) { var h = IP.house(pt[0], pt[1], false), cfg = IP.HOUSE[pt[0]], base = cfg && cfg.base && cfg.base[1]; if (!h || !base) { X.flat[pt[0]] = -1; return; }
        var cv = h.pic.canvas, tmp = document.createElement('canvas'); tmp.width = tmp.height = 1; var tx = tmp.getContext('2d'); tx.fillStyle = base; tx.fillRect(0, 0, 1, 1); var bc = tx.getImageData(0, 0, 1, 1).data;
        var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, n = 0, all = 0; for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { all++; if (d[i] === bc[0] && d[i + 1] === bc[1] && d[i + 2] === bc[2]) n++; } X.flat[pt[0]] = Math.round(1000 * n / Math.max(1, all)) / 10; });
      D.scenes.length = 0; D.push(D.inn.show('?innshow&beat=yard')); for (var i3 = 0; i3 < 60; i3++) D.update();
      var B6 = D.battle, m6 = D.iso.map, see = m6.props.filter(function (p) { return p.kind === 'innstubsee'; }); X.cutRows = m6.props.filter(function (p) { return p.kind === 'innstubcut'; }).map(function (p) { return p.sq.y; }).sort(function (a, b) { return a - b; });
      X.seeStubs = see.length; X.byMat = {}; see.forEach(function (p) { X.byMat[p.mat] = (X.byMat[p.mat] || 0) + 1; });
      var cx6 = document.createElement('canvas').getContext('2d');
      put(B6, [30, 12]); X.hidden = IP.seeing.figs.length; var s0 = IP.stubSeen || 0; see.forEach(function (p) { p.draw(cx6); }); X.drawn = (IP.stubSeen || 0) - s0;
      X.lamps = []; IP.PARTS().forEach(function (pt) { var sp = IP.houseSpec(pt[0], pt[1], false); (sp && sp.extras || []).forEach(function (e) { X.lamps.push(pt[0] + ' ' + e[0]); }); });
      put(B6, [30, 8]); X.hiddenFar = IP.seeing.figs.length; var s1 = IP.stubSeen || 0; see.forEach(function (p) { p.draw(cx6); }); X.drawnFar = (IP.stubSeen || 0) - s1;
    } catch (e) { X.err = String(e && e.stack || e).slice(0, 400); }
    var p2 = document.createElement('pre'); p2.textContent = 'INNSEE2 ' + JSON.stringify(X) + ' END2'; document.body.appendChild(p2);
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
    # THE SEE-THROUGH FIXES OF 11-12 (the inn seat; his 11-11 1734Z notes and his word to the desk): "we're gonna have to transparency the wagon during the inn fight";
    # "barns missing textures" / "the ceiling looks different" (the far slope's pieces are wedges, laid as parallelograms half of each was the slope's bare flat colour, a
    # row of triangles); "the stubby walls could be drawn another tile in each direction (edges visible)"; "north transparency would benefit if we could do those wallstubs"
    m2 = re.search(r'INNSEE2 (\{.*\}) END2', dom, re.S); X = json.loads(H.unescape(m2.group(1))) if m2 else {'err': 'no result'}
    if X.get('err'): ok('the fixes of 11-12: ' + X['err'], False)
    else:
        ok('the wagon see-through: %d squares of its canvas and %d of its rail; walking in the open drawn whole (%s); in a fight on the floor faint (%s, its rail %s); walking behind it at %s faint (%s)' % (X['wag'], X['rim'], X['walk'], X['fight'], X['fightRim'], X['hidAt'], X['hid']),
           X['wag'] == 8 and X['rim'] == 8 and X['walk'] == 1 and X['fight'] == X['see'] and X['fightRim'] == X['see'] and X['hidAt'] and X['hid'] == X['see'])
        f = X['flat']; ok('the far slope laid whole: of each building\'s picture, the share that is the far slope\'s bare flat colour -- the house %s%%, the wing %s%%, the barn %s%%' % (f.get('house'), f.get('wing'), f.get('barn')),
           all(0 <= f.get(k, -1) < 1 for k in ('house', 'wing', 'barn')))  # (2.8 to 6.4 before)
        ok('the cutaway\'s stubs a square more each way: rows %s; the walls in a figure\'s window: %d outer-wall stubs laid %s, on 30,12 behind the house (hidden %d) %d drawn, out on the grass at 30,8 (hidden %d) %d' % (X['cutRows'], X['seeStubs'], json.dumps(X['byMat']), X['hidden'], X['drawn'], X['hiddenFar'], X['drawnFar']),
           len(X['cutRows']) >= 2 and X['cutRows'][0] == 14 and X['cutRows'][-1] == 22 and X['seeStubs'] > 40 and X['hidden'] == 1 and 3 <= X['drawn'] <= 24 and X['hiddenFar'] == 0 and X['drawnFar'] == 0)
        # the door lamps sit against their wall (11-12, his "the door out of the kitchen to the lake looked like it was rotated 90 degrees from sitting proper against the wall"):
        # an east wall's lamp is the piece as drawn, plate on the wall (`_x`), not its mirror
        ok('the door lamps on the east walls: %s' % ', '.join(X.get('lamps', [])), len(X.get('lamps', [])) >= 2 and all(l.endswith('lamp_x') for l in X['lamps']))
    # THE GREYS (RULED 11-11, his "yes to the gulch and greys"; tools/greys-recolor.py): the team's horse and Willem's no cream left on their coats -- the lower half of every row
    # of Willem's sheet (the horse's) under 200 px of the cream horse's three colours, as it was a thousand and more; Amara's grey as it was
    from PIL import Image
    coat = {(216, 212, 196), (180, 154, 124), (148, 121, 95)}
    def coat_left(name, fh):
        im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'); W, Ht = im.size; px = im.load(); out = []
        for fy in range(0, Ht, fh):
            out.append(sum(1 for y in range(fy + int(fh * 0.55), min(Ht, fy + fh)) for x in range(W) if px[x, y][3] and px[x, y][:3] in coat))
        return out
    g, w = coat_left('horsegrey_p1', 150), coat_left('willemmounted_p1', 116)
    ok('the greys: the team\'s horse (horsegrey_p1) %d px of cream coat left; Willem\'s horse by row %s' % (sum(g), w), sum(g) == 0 and max(w) < 200)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
