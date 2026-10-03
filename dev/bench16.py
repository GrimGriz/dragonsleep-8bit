"""DEEP16 bench runner (dev/, gitignored): builds dev/bench16.html from deep16/index.html's own script list (so it never
drifts), runs it in headless Edge (a JS engine off his screen: the desktop app is never touched), and prints the table.

  python dev/bench16.py cleric:5                    one Cleric 5 against the four at 5, 10 fights
  python dev/bench16.py cleric:5,fighter:5 n=30     a band
  python dev/bench16.py wizard:3 vs=fighter:3       class against class
  python dev/bench16.py all lvl=3 n=10              every class alone against the four at 3 (one line each)
  add log=1 for one fight's log and the AI's top three choices each turn; json=1 for the raw result
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']


def build_page():
    html = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
    tags = []
    for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
        src, body = m.group(1), m.group(2)
        if src:
            src = src.split('?')[0]
            if src.endswith('js/main.js'):
                continue
            path = src[3:] if src.startswith('../') else 'deep16/' + src
            tags.append('<script src="../%s"></script>' % path)
        else:
            tags.append('<script>%s</script>' % body)
    catcher = "<script>window.onerror = function (m, s, l) { var p = document.createElement('pre'); p.textContent = 'LOADERR ' + m + ' @ ' + s + ':' + l; document.body.appendChild(p); };</script>"
    page = '<!doctype html><html><head><meta charset="utf-8"></head><body>\n' + catcher + '\n' + '\n'.join(tags) + '\n<script src="bench16.js"></script>\n</body></html>\n'
    import threading # (a page of its own each run: dev/check.py runs four at once, and one rewriting the shared page while another's Edge
    out = os.path.join(HERE, 'bench16-%d-%d.html' % (os.getpid(), threading.get_ident())) # read it gave a LOAD FAILED -- druid12, 10-01b)
    open(out, 'w', encoding='utf-8').write(page)
    return out


def run(params, timeout=600):
    page = build_page()
    import threading
    prof = os.path.join(tempfile.gettempdir(), 'deep16-bench-edge-%d-%d' % (os.getpid(), threading.get_ident())) # (a profile of its own: two runs at once share none -- threads too, dev/check.py)
    url = 'file:///' + page.replace('\\', '/') + '?' + urllib.parse.urlencode(params)
    cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--dump-dom', url]
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout)
    finally:
        try: os.remove(page)
        except OSError: pass
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'BENCH16 (\{.*\})', dom, re.S)
    if not m:
        errs = re.findall(r'LOADERR ([^<]*)', dom)
        return {'error': 'no result', 'load': errs[:5] or dom[-300:]}
    import html as H
    return json.loads(H.unescape(m.group(1)))


def line(r):
    top = lambda d: ', '.join('%s %d' % kv for kv in sorted(d.items(), key=lambda kv: -kv[1])[:6])
    s = '%-28s vs %-22s L%d  won %2d lost %2d other %d  rounds %.1f  party HP left %s%%  downs %s' % (','.join(r['foes'])[:28], r['vs'][:22], r['lvl'], r['won'], r['lost'], r['other'], r['avgRounds'], r.get('partyLeft', '?'), r.get('partyDowns', '?'))
    s += '\n    dealt: ' + top(r['dealt']) + '\n    taken: ' + top(r['taken']) + '\n    casts: ' + top(r['casts'])
    if r.get('errors'):
        s += '\n    ERRORS: ' + ' || '.join(e.replace('\n', ' ')[:300] for e in r['errors'])
    return s


def main(argv):
    """returns 1 if any run failed to load or logged an error (10-01b: it used to exit 0 on a broken run; dev/check.py is the green/red)"""
    failed = 0
    args = [a for a in argv if '=' not in a]
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    what = args[0] if args else 'fighter:5'
    lvl = kw.get('lvl')
    jobs = []
    if what == 'ladder':
        ids = re.findall(r"\{ id: '([a-z0-9]+)',[^}]*?level: (\d)", open(os.path.join(ROOT, 'deep16', 'data', 'fights.js'), encoding='utf-8').read())
        for fid, L in ids:
            r = run({'fight': fid, 'lvl': L, 'n': kw.get('n', '3'), 'seed': kw.get('seed', '1')})
            if 'error' in r:
                print(fid, 'FAILED ' + str(r)[:300]); failed = 1
                continue
            failed = failed or int(bool(r.get('errors')))
            errs = ('  ERRORS: ' + ' || '.join(e.replace(chr(10), ' ')[:200] for e in r['errors'])) if r.get('errors') else ''
            print('%-12s L%s won %d lost %d other %d rounds %.1f%s' % (fid, L, r['won'], r['lost'], r['other'], r['avgRounds'], errs))
        return failed
    if what == 'all':
        for c in CLASSES:
            jobs.append(c + ':' + (lvl or '5'))
    else:
        jobs.append(what)
    for j in jobs:
        L = lvl or (j.split(',')[0].split(':')[1] if ':' in j.split(',')[0] else '5')
        params = {'foes': j, 'lvl': L, 'n': kw.get('n', '10'), 'seed': kw.get('seed', '1')}
        for k in ('vs', 'fight', 'guests', 'sky', 'mode', 'ward', 'plain', 'avghp', 'stone', 'raw'):
            if kw.get(k):
                params[k] = kw[k]
        if kw.get('log'):
            params['log'] = '1'
        r = run(params)
        if 'error' in r:
            print(j, 'FAILED:', r); failed = 1
            continue
        if 'checks' in r and 'won' not in r and not kw.get('json'):    # (a mode: its checks, not a fight's table -- the show, 10-02)
            print('\n'.join(r.get('report', [])))
            print('\n'.join(r['checks']))
            if r.get('errors'):
                print('ERRORS: ' + ' || '.join(str(e).replace('\n', ' ')[:300] for e in r['errors']))
            if r.get('log'):
                print('\n'.join('      ' + x for x in r['log']))
            failed = failed or int(bool(r.get('errors'))) or int(any(str(c).startswith('FAIL') for c in r['checks']))
            continue
        failed = failed or int(bool(r.get('errors'))) or int(any(str(c).startswith('FAIL') for c in r.get('checks', [])))
        if kw.get('json'):
            print(json.dumps(r, indent=1))
        else:
            print(line(r))
            if r.get('log'):
                print('\n'.join('      ' + x for x in r['log']))
            if kw.get('fights'):
                print('\n'.join('      ' + x for x in r['fights']))
    return failed


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
