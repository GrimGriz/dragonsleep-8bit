"""The eyes list draws (10-06, Griz: "yes" to a gate check after 3d4f63f shipped js/eyes.js with its apostrophes halved by a Bash heredoc and
situations.html drew no eyes rows at all for a commit): reads js/eyes.js row by row -- every row an id, a pri, a title, a pt, a url and a look,
no id twice -- then opens situations.html itself in headless Edge (a fresh profile: nothing noted) and reads what it drew: the count line's
total must be the eyes rows plus the story situations, the first page six rows, the pager's page count right. A syntax error in eyes.js
leaves DS.EYES undefined and the page draws the story alone: that reads FAIL here.  python dev/eyes-probe.py"""
import os, re, sys, subprocess, tempfile, math, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

PER = 6
bad, n = [], [0]
def ok(c, what):
    n[0] += 1; print(('ok   ' if c else 'FAIL ') + what)
    if not c: bad.append(what)

def main():
    src = open(os.path.join(ROOT, 'js', 'eyes.js'), encoding='utf-8').read()
    heads = [(m.start(), m.group(1)) for m in re.finditer(r"^ {4}'([a-z0-9-]+)': \{", src, re.M)]
    ok(len(heads) >= 1, 'js/eyes.js has rows (%d)' % len(heads))
    ids = [h[1] for h in heads]
    ok(len(set(ids)) == len(ids), 'no id twice' + ('' if len(set(ids)) == len(ids) else ': ' + ', '.join(i for i in set(ids) if ids.count(i) > 1)))
    bounds = [h[0] for h in heads] + [len(src)]
    lacking = []
    for k, (at, rid) in enumerate(heads):
        miss = [f for f in ('pri:', 'group:', 'title:', 'pt:', 'url:', 'look:') if f not in src[at:bounds[k + 1]]]
        if miss: lacking.append('%s lacks %s' % (rid, ' '.join(miss)))
    ok(not lacking, 'every row has pri, group, title, pt, url, look' + ('' if not lacking else ': ' + '; '.join(lacking)))
    sits = len(re.findall(r"^ {4}[a-z0-9]+: \{ group:", open(os.path.join(ROOT, 'js', 'situations.js'), encoding='utf-8').read(), re.M))
    want = len(heads) + sits
    # the page itself, as he opens it
    prof = os.path.join(tempfile.gettempdir(), 'eyes-probe-edge-%d' % os.getpid())
    url = 'file:///' + os.path.join(ROOT, 'situations.html').replace('\\', '/') + '?probe=' + str(os.getpid())
    p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA +
                       ['--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=120)
    dom = H.unescape(p.stdout.decode('utf-8', 'replace'))
    if not dom.strip():
        print('no result (the browser printed nothing)'); return 1
    m = re.search(r'id="count"><b>(\d+)</b> of (\d+) noted', dom)
    total = int(m.group(2)) if m else -1
    ok(m is not None and total == want, 'situations.html draws every row: %d of %d wanted (%d eyes + %d situations)' % (total, want, len(heads), sits))
    drawnIds = [i for i in re.findall(r'class="item[^"]*" data-id="([^"]+)"', dom) if re.fullmatch(r'[a-z0-9-]+', i)] # (the page's own template text in its script matches too: `' + esc(id) + '`)
    ok(len(drawnIds) == min(PER, want), 'the first page holds %d rows (drew %d: %s)' % (min(PER, want), len(drawnIds), ' '.join(drawnIds)))
    pg = re.search(r'id="pg">page 1 of (\d+)<', dom)
    ok(pg is not None and int(pg.group(1)) == math.ceil(want / PER), 'the pager counts %d pages (says %s)' % (math.ceil(want / PER), pg.group(1) if pg else '?'))
    eyesDrawn = len(re.findall(r'data-id="eyes-', dom))
    ok(eyesDrawn == min(PER, len(heads)), 'the eyes rows come first (%d of the first six)' % eyesDrawn)
    print('EYESPROBE %d checks, %s' % (n[0], 'all ok' if not bad else '%d FAILED' % len(bad))) # (check.py greps the word FAIL: a clean run must not print it)
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
