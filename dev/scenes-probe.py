"""The scene simulator plays (2026-11-25, scenes-1125; deep16/scenes.html, Griz 11-24: "Can we do an html - scene simulator - that does these dialogs for
rapid review without having to load into the game ..."). Opens deep16/scenes.html?probe in headless Chromium (bench16.browser(), a fresh profile, from file:// as
the other probes do) and reads what it wrote: the game's own scripts loaded with no error; every row of the REVIEW shelf and a scene of each kind staged, its
`picks` clicked, its words said, `expect` in them and `mark` among the marks at their backs (the supper's gossip by thread and depth, the renown greeting by band,
the council's line, Doran's first supper home, Winters keeping his ring); none broke; and the browser's own storage holding nothing of the game's -- the page
saves nothing to a save (only its notes draft, deep16.scenes.*).
  python dev/scenes-probe.py          the REVIEW shelf and the kinds (about a minute)
  python dev/scenes-probe.py all      every scene on the front page staged to its first choice (several minutes)"""
import os, re, sys, json, subprocess, tempfile, shutil, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

bad, n = [], [0]
def ok(c, what):
    n[0] += 1; print(('ok   ' if c else 'FAIL ') + what)
    if not c: bad.append(what)

def main():
    every = len(sys.argv) > 1 and sys.argv[1] == 'all'
    prof = os.path.join(tempfile.gettempdir(), 'scenes-probe-%d' % os.getpid())
    url = 'file:///' + os.path.join(ROOT, 'deep16', 'scenes.html').replace('\\', '/') + ('?probe=all' if every else '?probe')
    try:
        p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA +
                           ['--user-data-dir=' + prof, '--virtual-time-budget=%d' % (3600000 if every else 600000), '--dump-dom', url], capture_output=True, timeout=1500 if every else 300)
    finally:
        shutil.rmtree(prof, ignore_errors=True)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'SCENES (\{.*?\})</pre>', dom, re.S)
    ok(bool(m), 'the page wrote its probe (scenes.html?probe%s)' % ('=all' if every else '') + ('' if m else ': ' + re.sub(r'\s+', ' ', dom[-300:])))
    if not m: return
    r = json.loads(H.unescape(m.group(1)))
    ok(not r['loadErrors'], 'the game\'s own scripts loaded with no error' + ('' if not r['loadErrors'] else ': ' + '; '.join(r['loadErrors'])))
    ok(r['scenes'] >= 100, 'the front page lists the game\'s scenes (%d)' % r['scenes'])
    ok(r['code'] >= 2000 and r['series'] >= 500, 'the marks have their tables: %d strings of the scene files, %d series lines' % (r['code'], r['series']))
    for x in r['runs']:
        why = []
        if x.get('broke'): why.append('it broke')
        if not x.get('lines'): why.append('nothing said')
        if x.get('end') == 'timeout': why.append('it never came to a choice')
        if str(x.get('end', '')).startswith('no '): why.append(x['end'])
        if x.get('expect') is False: why.append('the words expected were not said')
        if x.get('mark') is False: why.append('the mark expected was not at any line\'s back')
        ok(not why and x.get('ok'), '%s: %d lines, %s%s' % (x['id'], x.get('lines', 0), x.get('end'), '' if not why else ' -- ' + '; '.join(why)))
    ok(not r['storage']['gameKeysOutside'], 'the browser\'s storage holds nothing of the game\'s (%s)' % (', '.join(r['storage']['browser']) or 'empty'))
    if r.get('unreached'): print('     not reachable here (THE WORLD\'s walk): ' + '; '.join(r['unreached']))

if __name__ == '__main__':
    main()
    print('%s  %d checks, %d failed' % ('GREEN' if not bad else 'RED', n[0], len(bad)))
    sys.exit(1 if bad else 0)
