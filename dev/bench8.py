"""The 8-bit battle's bench (dev/, gitignored; 09-28g): builds dev/bench8-<pid>-<thread>.html from index.html's own script list (main.js left
out: no rAF loop, no title) plus dev/harness.js, dev/fastbattle.js and dev/bench8.js, runs it in headless Edge off his screen,
and prints what the battle said. Run it from PowerShell (the Bash tool's sandbox gets no DOM back from Edge).

  python dev/bench8.py lymen          Lymen's list (09-28g): Magic Weapon, Command, Protection, Sanctuary, Branding Smite
  python dev/bench8.py ingrith        Ingrith the cleric guest (09-28g): her heals, Preserve Life, Turn Undead, Bless, the weapon
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EDGE = os.environ.get('DEEP16_BROWSER') or r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' # (the same two knobs as bench16.py: DEEP16_BROWSER another headless Chromium, DEEP16_BROWSER_ARGS its extra flags -- unset, the desktop is as it was)
EXTRA = os.environ.get('DEEP16_BROWSER_ARGS', '').split()


def build_page():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    tags = []
    for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
        src, body = m.group(1), m.group(2)
        if src:
            src = src.split('?')[0]
            if src.endswith('js/main.js'):
                continue
            tags.append('<script src="../%s"></script>' % src)
        else:
            tags.append('<script>%s</script>' % body)
    catcher = "<script>window.onerror = function (m, s, l, c, e) { var p = document.createElement('pre'); p.textContent = 'LOADERR ' + m + ' @ ' + s + ':' + l + (e && e.stack ? ' ' + e.stack : ''); document.body.appendChild(p); };</script>"
    page = ('<!doctype html><html><head><meta charset="utf-8"></head><body>\n<canvas id="screen" width="256" height="240"></canvas>\n' + catcher + '\n'
            + '\n'.join(tags) + '\n<script src="harness.js"></script>\n<script src="fastbattle.js"></script>\n<script src="bench8.js"></script>\n</body></html>\n')
    import threading # (a page of its own each run, as bench16.py's: two `check.py all` at once, or a probe beside the bench, rewrote one
    out = os.path.join(HERE, 'bench8-%d-%d.html' % (os.getpid(), threading.get_ident())) # bench8.html under each other -- the gate handoff §2.3, 10-06; the caller removes it)
    open(out, 'w', encoding='utf-8').write(page)
    return out


def run(params, timeout=300):
    page = build_page()
    import threading
    prof = os.path.join(tempfile.gettempdir(), 'ds8-bench-edge-%d-%d' % (os.getpid(), threading.get_ident()))
    url = 'file:///' + page.replace('\\', '/') + '?' + urllib.parse.urlencode(params)
    cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + EXTRA + ['--user-data-dir=' + prof, '--dump-dom', url]
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout)
    finally:
        try: os.remove(page)
        except OSError: pass
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'BENCH8 (\{.*\})', dom, re.S)
    errs = re.findall(r'<pre>LOADERR ([^<]*)', dom) # (the catcher's <pre>: its own source, inline in the page, says LOADERR too)
    if not m:
        return {'error': 'no result', 'load': errs[:5] or dom[-400:]}
    import html as H
    r = json.loads(H.unescape(m.group(1)))
    # a script that failed to load, though the page still wrote its result (10-06, the 8-bit battle seat: a js/embed.js that would not parse left the 8-bit's own
    # battle in place and every bench ran on with no grid) -- returned always since 10-07 (the todo §6), and the run is a failure
    if errs:
        r['loaderr'] = [H.unescape(e).strip()[:300] for e in errs[:5]]
    return r


if __name__ == '__main__':
    kw = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
    args = [a for a in sys.argv[1:] if '=' not in a]
    kw['test'] = args[0] if args else 'lymen'
    r = run(kw)
    if 'error' in r:
        print('FAILED', r)
        sys.exit(1)
    for ln in r.get('loaderr', []):
        print('LOADERR ' + ln) # (dev/check.py script() reads LOADERR as RED)
    for k in ('result', 'stuck', 'err', 'errors', 'party', 'guests', 'foes', 'checks'):
        if r.get(k):
            print('%s: %s' % (k, r[k]))
    print('--- the battle said:')
    for ln in r.get('log', []):
        print('  ' + ln)
    if r.get('loaderr'):
        sys.exit(1)
