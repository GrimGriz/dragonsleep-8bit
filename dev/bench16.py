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
def browser():
    """the headless browser every bench, probe and shot launches: DEEP16_BROWSER if set (another headless Chromium, the cloud seat's;
    DEEP16_BROWSER_ARGS its extra flags, e.g. --no-sandbox as root), else Playwright's Chromium when installed, else the desktop's Edge.
    Chromium first since 10-15 (Griz: "if you guise have to use microsoft browsers, that playwright thing sounds the way to go"): headless
    Edge signs each fresh --user-data-dir profile in to the PC's Microsoft account, and a gate's dozens of profiles (several seats gating at
    once) got the sign-in refused -- "This application made too many requests", 0x80860010. Chromium has no Microsoft sign-in.
    (python -m pip install --user playwright; python -m playwright install chromium-headless-shell)"""
    if os.environ.get('DEEP16_BROWSER'): return os.environ['DEEP16_BROWSER']
    import glob
    # (Playwright's headless shell: its full chrome.exe would not start on his PC -- Windows' side-by-side loader refused its version
    # assembly, 14001 -- and the shell is the build made for this; python -m playwright install chromium-headless-shell)
    pw = glob.glob(os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright', 'chromium_headless_shell-*', 'chrome-headless-shell-win*', 'chrome-headless-shell.exe'))
    if pw: return max(pw, key=lambda p: int(re.search(r'chromium_headless_shell-(\d+)', p).group(1)))
    return r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
EDGE = browser() # (the name kept: every probe reads bench16.EDGE)
EXTRA = os.environ.get('DEEP16_BROWSER_ARGS', '').split()
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']


def build_page():
    html = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
    tags = []
    for m in re.finditer(r'<script(?: src="([^"]+)")?>(.*?)</script>', html, re.S):
        src, body = m.group(1), m.group(2)
        if src:
            src = src.split('?')[0]
            if src.endswith('js/main.js') or src.endswith('data/world-near.js'): # (the Silverton area's map, 10-22: the benches walk THE WORLD alone, as before it; mode=near1022 loads it)
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
    cmd = [EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + EXTRA + ['--user-data-dir=' + prof, '--dump-dom', url]
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout)
    finally:
        try: os.remove(page)
        except OSError: pass
        import shutil # (and the run's own Edge profile, ~20 MB: they were never removed, and a day of tuning left 3694 in %TEMP% -- the disk full, every bench and the gate
        shutil.rmtree(prof, ignore_errors=True) # RED with "not enough space", 10-08)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'BENCH16 (\{.*\})', dom, re.S)
    if not m:
        errs = re.findall(r'LOADERR ([^<]*)', dom)
        return {'error': 'no result', 'load': errs[:5] or dom[-300:]}
    import html as H
    r = json.loads(H.unescape(m.group(1)))
    if isinstance(r, dict) and r.get('replay'):
        try: r['replayFile'] = write_replay(r.pop('replay'), r.get('log'))
        except Exception as e: r['replayFile'] = 'NOT WRITTEN: %s' % e
    elif isinstance(r, dict) and 'replay' in r: r.pop('replay')
    return r


# THE MARKERS' REPLAY (11-15, the markers-replay seat, on Griz's "can I get a replay that shows those markers based of the quest walk runs?"): a report that carries `replay`
# (dev/bench16.js mode=questwalk1114, its RQ) has it written to walk-replays/ in the SHARED checkout -- git's common dir's folder, whichever worktree the bench ran in, so the
# page on 8923 finds it: deep16/?world&replay=<name> (js/replay.js) -- as <name>.json, the run's log beside it as <name>.log, and walk-replays/index.json listing them all.
# Gitignored, as play-records/ is: a run's file is the bench's, not the game's. <name>: questwalk-<order>-seed<N>-<MMDD> (UTC), the same name again the same day overwritten
REPLAYS = 'walk-replays'
def replay_dir():
    if os.environ.get('WALK_REPLAYS'): # (a folder of its own: a seat's trial runs, kept out of his list)
        os.makedirs(os.environ['WALK_REPLAYS'], exist_ok=True)
        return os.environ['WALK_REPLAYS']
    base = ROOT
    try:
        cd = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True, timeout=30).stdout.strip()
        if cd:
            cd = cd if os.path.isabs(cd) else os.path.join(ROOT, cd)
            base = os.path.dirname(os.path.normpath(cd))
    except Exception:
        pass
    d = os.path.join(base, REPLAYS)
    os.makedirs(d, exist_ok=True)
    return d


def write_replay(rep, log=None):
    import datetime
    d = replay_dir()
    when = datetime.datetime.now(datetime.timezone.utc)
    mode = re.sub(r'\d+$', '', str(rep.get('mode', 'walk'))) or 'walk'
    name = '%s-%s-seed%s-%s' % (mode, re.sub(r'[^a-z0-9]+', '', str(rep.get('order', '')).lower()) or 'walk', rep.get('seed', '0'), when.strftime('%m%d'))
    rep['name'] = name
    put(os.path.join(d, name + '.json'), json.dumps(rep, separators=(',', ':')))
    if log:
        put(os.path.join(d, name + '.log'), '\n'.join(log) + '\n')
    index_replays(d)
    return os.path.join(d, name + '.json')


def put(path, text): # (whole or not at all: seeds run side by side, and one's index must never read another's file half written)
    tmp = '%s.%d.tmp' % (path, os.getpid())
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(text)
    os.replace(tmp, path)


def index_replays(d=None):
    """walk-replays/index.json: every replay's name and what it is, newest first (the door's list: deep16/?world&replay)"""
    d = d or replay_dir()
    out = []
    for fn in os.listdir(d):
        if not fn.endswith('.json') or fn == 'index.json':
            continue
        try:
            rep = json.load(open(os.path.join(d, fn), encoding='utf-8'))
        except Exception:
            continue
        fr = rep.get('frames') or [{}]
        out.append({'name': fn[:-5], 'mode': rep.get('mode'), 'seed': rep.get('seed'), 'order': rep.get('order'), 'made': rep.get('made'),
                    'days': int(max([f.get('t', 0) for f in fr] + [0]) // 24) + 1, 'meets': len(rep.get('meets') or []), 'lost': len(rep.get('rewinds') or [])})
    out.sort(key=lambda x: (x.get('made') or ''), reverse=True)
    put(os.path.join(d, 'index.json'), json.dumps(out, indent=0))
    return out


def line(r):
    top = lambda d: ', '.join('%s %d' % kv for kv in sorted(d.items(), key=lambda kv: -kv[1])[:6])
    s = '%-28s vs %-22s L%d  won %2d lost %2d other %d  rounds %.1f  party HP left %s%%  downs %s' % (','.join(r['foes'])[:28], r['vs'][:22], r['lvl'], r['won'], r['lost'], r['other'], r['avgRounds'], r.get('partyLeft', '?'), r.get('partyDowns', '?'))
    s += '\n    dealt: ' + top(r['dealt']) + '\n    taken: ' + top(r['taken']) + '\n    casts: ' + top(r['casts'])
    if r.get('climbs'):
        s += '\n    climbs: ' + top(r['climbs']) # (climb=n, 10-04: who went up a cliff, slipped, or fell)
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
        for k in ('vs', 'fight', 'guests', 'sky', 'mode', 'ward', 'plain', 'avghp', 'quest', 'stone', 'raw', 'climb', 'flvl', 'measure', 'plus', 'callN', 'dbl', 'toy', 'laugh', 'reads', 'sheet', 'runs', 'retry', 'restart', 'only'):  # (callN: the Harbinger's pack held at a size, 10-08) (sheet: the show's foes wear it, 10-15) (runs: module1017's plays through, 10-17) (only: fare1125's one fight, 11-25)
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
