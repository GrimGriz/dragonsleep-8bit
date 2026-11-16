"""The eyes list draws (10-06, Griz: "yes" to a gate check after 3d4f63f shipped js/eyes.js with its apostrophes halved by a Bash heredoc and
situations.html drew no eyes rows at all for a commit): reads js/eyes.js row by row -- every row an id, a pri, a title, a pt, a url and a look,
no id twice -- then opens situations.html itself in headless Edge (a fresh profile: nothing noted) and reads what it drew: the count line's
total must be the eyes rows plus the story situations, the first page six rows, the pager's page count right. A syntax error in eyes.js
leaves DS.EYES undefined and the page draws the story alone: that reads FAIL here. Since 11-15 (the card-text seat) every row carries its one-line `obj`
within the cap (tools/eyes-obj.py's rules), and the first page leads each eyes row with it, the builders' note folded.  python dev/eyes-probe.py"""
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
    # every row leads with its obj (11-15, the card-text seat; his "review the situations page/syvia's deck. Particularly the text. Where you can, draft a
    # version where what they want eyes on is a quest objective"): one line within the cap, no file or switch in it (tools/eyes-obj.py check, the same rules)
    import importlib.util
    spec = importlib.util.spec_from_file_location('eyes_obj', os.path.join(ROOT, 'tools', 'eyes-obj.py')); EO = importlib.util.module_from_spec(spec); spec.loader.exec_module(EO)
    try:
        rs = EO.rows(src); objBad = EO.problems(rs); objs = {r['id']: r['f'].get('obj') for r in rs}
    except Exception as e:
        rs, objBad, objs = [], ['the rows did not parse: %s' % e], {}
    longest = max([EO.words(o) for o in objs.values() if isinstance(o, str)] or [0])
    ok(not objBad and len(rs) == len(heads), 'every row leads with an obj, %d words at most (the cap %d words, %d characters; no file, switch or bench name)%s' % (
        longest, EO.CAP_WORDS, EO.CAP_CHARS, '' if not objBad else ': ' + '; '.join(objBad[:12]) + (' and %d more' % (len(objBad) - 12) if len(objBad) > 12 else '')))
    sits = len(re.findall(r"^ {4}[a-z0-9]+: \{ group:", open(os.path.join(ROOT, 'first', 'js', 'situations.js'), encoding='utf-8').read(), re.M))
    # (and the second game's, from a link -- deep16/js/situations16.js DS.SIT16, story rows on the same page since 10-30)
    s16 = os.path.join(ROOT, 'deep16', 'js', 'situations16.js')
    if os.path.exists(s16): sits += len(re.findall(r"^ {4}[a-z0-9]+: \{ group:", open(s16, encoding='utf-8').read(), re.M))
    want = len(heads) + sits
    # the page itself, as he opens it
    prof = os.path.join(tempfile.gettempdir(), 'eyes-probe-edge-%d' % os.getpid())
    url = 'file:///' + os.path.join(ROOT, 'situations.html').replace('\\', '/') + '?probe=' + str(os.getpid())
    p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA +
                       ['--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=120)
    import shutil
    shutil.rmtree(prof, ignore_errors=True) # (its Edge profile, once read: never removed before, 10-08 -- the disk filled with the benches')
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
    # the first page's eyes rows as drawn: the obj the link's words, the title under it, the builders' note shut (11-15)
    drawn = re.findall(r'class="item[^"]*" data-id="(eyes-[a-z0-9-]+)"><h3><span class="n">\d+</span><a [^>]*>(.*?)</a></h3>(<p class="ttl">.*?</p><details class="bnote"><summary>)?', dom)
    led = [d for d in drawn if objs.get(d[0]) and d[1] == objs[d[0]].strip() and d[2]]
    ok(drawn and len(led) == len(drawn), 'the first page leads with each row\'s obj, its title under it and its builders\' note folded (%d of %d%s)' % (
        len(led), len(drawn), '' if len(led) == len(drawn) else ': ' + ', '.join(d[0] for d in drawn if d not in led)))
    print('EYESPROBE %d checks, %s' % (n[0], 'all ok' if not bad else '%d FAILED' % len(bad))) # (check.py greps the word FAIL: a clean run must not print it)
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
