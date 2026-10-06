"""The Keeper of the Flooded Stair on the grid (10-03, js/keeper.js): builds dev/keeper-probe.html from DEEP16's own script list (bench16.build_page's way) with
dev/keeper-probe.js in place of bench16.js, runs it in headless Edge, prints the checks.  python dev/keeper-probe.py
  runs=30 lvls=3,4,5 start=rune ...   whole fights by the class AI (start=ledge|rune: where the party comes in, 10-03)
  main=<ref>                          the commit the ladder's fight is diffed against (default MAIN_REF: main before the Keeper work landed)
  eight=0                             leave out the 8-bit half (dev/keeper8-probe.js: the stair's quest, the rune, the spawns through the seam)"""
import os, re, sys, json, subprocess, tempfile, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

# THE LADDER'S FIGHT IS MAIN'S OLD ONE (10-03, Griz): origin/main as it stood before the Keeper work landed. Pinned, not origin/main itself: once the new Keeper is on
# main, main's `keeper` is the new one, and the ladder's must still match this
MAIN_REF = 'ed7be2a'


def git_show(ref, path):
    p = subprocess.run(['git', 'show', ref + ':' + path], cwd=ROOT, capture_output=True)
    return p.stdout.decode('utf-8') if p.returncode == 0 else None


def literal(lines, i):
    """the object literal that opens on lines[i] (at its first '{'), to its closing brace: strings and comments skipped (a comment's "map's" opens no string), as text"""
    text = '\n'.join(lines[i:])
    s = text.index('{')
    depth, q, k = 0, None, s
    while k < len(text):
        ch = text[k]
        if q:
            if ch == '\\': k += 1
            elif ch == q: q = None
        elif text.startswith('//', k): k = text.index('\n', k)
        elif text.startswith('/*', k): k = text.index('*/', k) + 1
        elif ch in '\'"`': q = ch
        elif ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: return text[s:k + 1]
        k += 1
    raise ValueError('unclosed literal')


def main_records(ref):
    """main's keeper foe, floodstair map, keeper fight and keeper_p1 sheet (JS literals, as text), and its level-3 rung (fight ids)"""
    out = {'ref': ref}
    try:
        foes, maps, fights, sprites = [git_show(ref, 'deep16/data/' + f) for f in ('foes.js', 'maps.js', 'fights.js', 'sprites.js')]
        if not all((foes, maps, fights, sprites)):
            out['err'] = 'git show %s: a file missing' % ref
            return out
        fl = foes.split('\n'); out['foe'] = literal(fl, fl.index('  keeper: {'))
        ml = maps.split('\n'); out['map'] = literal(ml, ml.index('window.D16.MAPS.floodstair = {'))
        gl = fights.split('\n')
        out['fight'] = literal(gl, [n for n, s in enumerate(gl) if s.startswith("    { id: 'keeper',")][0])
        sp = sprites[sprites.index('.SHEETS = ') + len('.SHEETS = '):].rstrip().rstrip(';')
        out['sheet'] = json.dumps(json.loads(sp)['keeper_p1'])
        rung = []
        for n, s in enumerate(gl):
            m = re.match(r"    \{ id: '([\w-]+)'", s)
            if not m: continue
            rec = literal(gl, n)
            lv = re.search(r'\blevel: (\d+)', rec)
            if not lv or int(lv.group(1)) != 3 or re.search(r'\bladder: false', rec.split('\n')[0]): continue
            rank = -1 if m.group(1) == 'gallery' else 1 if re.search(r'\bbestiary: true', rec.split('\n')[0]) else 0
            rung.append((rank, n, m.group(1)))
        out['rung3'] = [r[2] for r in sorted(rung)]
    except Exception as e:
        out['err'] = repr(e)
    return out


def edge(page, params, tag, prof):
    url = 'file:///' + page.replace('\\', '/') + ('?' + urllib.parse.urlencode(params) if params else '')
    p = subprocess.run([bench16.EDGE] + bench16.EXTRA + ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=600)
    dom = p.stdout.decode('utf-8', 'replace')
    import html as H
    m = re.search(tag + r' (\{.*?\})\s*</pre>', dom, re.S)
    if not m:
        return None, (re.findall(r'LOADERR ([^<]*)', dom)[:5] or dom[-400:])
    return json.loads(H.unescape(m.group(1))), None


def main():
    args = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
    M = main_records(args.get('main', MAIN_REF))
    js = 'window.KEEPER_MAIN = { ref: %s, err: %s, rung3: %s' % (json.dumps(M['ref']), json.dumps(M.get('err')), json.dumps(M.get('rung3')))
    for k in ('foe', 'map', 'fight', 'sheet'):
        js += ', %s: %s' % (k, M.get(k) or 'null')
    js += ' };'
    built = bench16.build_page() # (a page of its own each run: bench16.py, 10-01b)
    page = open(built, encoding='utf-8').read().replace('<script src="bench16.js"></script>', '<script>\n' + js + '\n</script>\n<script src="keeper-probe.js"></script>')
    os.remove(built)
    out = os.path.join(HERE, 'keeper-probe-%d.html' % os.getpid()) # (the run's own pages, this and the 8-bit half's: two gates at once collided on fixed names -- 10-06)
    open(out, 'w', encoding='utf-8').write(page)
    try:
        r, err = edge(out, args, 'KEEPERPROBE', os.path.join(tempfile.gettempdir(), 'keeper-probe-edge-%d' % os.getpid()))
    finally:
        os.remove(out)
    if not r:
        print('no result', err)
        return
    checks, errors = r['checks'], r['errors']
    # the 8-bit half: the stair's quest and the mark, through the seam (js/events.js, js/embed.js) -- dev/keeper8-probe.js on the 8-bit bench's page
    if args.get('eight') != '0':
        import bench8
        built8 = bench8.build_page()
        p8 = open(built8, encoding='utf-8').read().replace('<script src="bench8.js"></script>', '<script src="keeper8-probe.js"></script>')
        os.remove(built8)
        out8 = os.path.join(HERE, 'keeper8-probe-%d.html' % os.getpid())
        open(out8, 'w', encoding='utf-8').write(p8)
        try:
            r8, err8 = edge(out8, None, 'KEEPER8', os.path.join(tempfile.gettempdir(), 'keeper8-probe-edge-%d' % os.getpid()))
        finally:
            os.remove(out8)
        if not r8:
            checks.append(['8-bit: the stair\'s page ran (' + str(err8)[:300] + ')', False])
        else:
            checks += [['8-bit: ' + c[0], c[1]] for c in r8['checks']]
            errors += ['8-bit: ' + e for e in r8['errors']]
    for c in checks:
        print(('ok   ' if c[1] else 'FAIL ') + c[0])
    print('errors:', errors)
    print('%d/%d' % (sum(1 for c in checks if c[1]), len(checks)))


if __name__ == '__main__':
    main()
