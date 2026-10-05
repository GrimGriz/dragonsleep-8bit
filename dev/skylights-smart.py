"""The Skylights benched with a party AI of its own (10-05, Griz: "In my imagination, the party has a fairly generic AI fight for the benches.
Please (off to the side somewhere - not for live) custom craft AI for the party as you would play it knowing how this fight works and run that
as a lvl 6 and lvl 7 bench"). Off to the side: dev/skylights-party.js is loaded only by this runner's page, between the game's scripts and the
bench; the game never loads it. The bench is dev/bench16.js itself, copied for the run with two small taps (a fight's tracker line beside its
result, and log=1 logging fight `logAt` instead of the first) -- bench16.js is not edited. From PowerShell (headless Edge answers nothing from
the Bash sandbox):

  python dev/skylights-smart.py                 the smart party at 6 and at 7, n=8, seed 1, then the class AI's party on the same seeds
  python dev/skylights-smart.py lvl=6 n=20      one level, more fights
  python dev/skylights-smart.py lvl=6 n=8 log=1 logAt=6     fight 6's log and the smart party's decisions (dev/skylights-smart-log-L6.txt)
  python dev/skylights-smart.py probe=1 lvl=6   the four's sheets at that level (what the plan reads)
  base=0 the smart party only · smart=0 the class AI's only · fights=0 the table without the fight lines
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bench16

TAIL = {'v': '<script src="bench16.js"></script>'}
COPY = os.path.join(HERE, '_sky-bench16-%d.js' % os.getpid())
_orig = bench16.build_page


def _page():
    p = _orig()
    s = open(p, encoding='utf-8').read()
    s = s.replace('<script src="bench16.js"></script>', TAIL['v'])
    open(p, 'w', encoding='utf-8').write(s)
    return p


bench16.build_page = _page


def _copy():
    src = open(os.path.join(HERE, 'bench16.js'), encoding='utf-8').read()
    a = "(B.climbSaid ? ' [one climbed]' : '')"
    b = "if (wantLog && !log) log = "
    assert src.count(a) == 1 and src.count(b) == 1, 'bench16.js moved under the taps'
    src = src.replace(a, a + " + (B.skyNote ? ' {' + B.skyNote() + '}' : '')")
    src = src.replace(b, "if (wantLog && !log && (get('logAt', '') === '' || +get('logAt', '') === i)) log = ")
    open(COPY, 'w', encoding='utf-8').write(src)


def run(params, smart=True, probe=False):
    name = os.path.basename(COPY)
    if probe:
        TAIL['v'] = '<script src="skylights-party.js"></script>\n<script src="skylights-probe.js"></script>'
    else:
        TAIL['v'] = '<script src="skylights-party.js"></script>\n<script src="%s"></script>' % name
    p = dict(params)
    p['smart'] = '1' if smart else '0'
    return bench16.run(p)


def glass(f):
    m = re.search(r'the skylight over the Sunshaft (\d+)/120', f)
    return int(m.group(1)) if m else -1


def four(f):
    """the four's hit points left over their maximum, and how often they went down (the tracker's count)"""
    hp = re.findall(r'(?:Barley|Aurdin|Vivian|Lymen) (\d+)/(\d+)', f)
    left = sum(int(a) for a, b in hp) / max(1, sum(int(b) for a, b in hp))
    m = re.search(r'the four went down (\d+)x', f)
    return left, int(m.group(1)) if m else 0


def summary(tag, r):
    if 'error' in r:
        return tag + ' FAILED ' + str(r)[:600]
    fs = r.get('fights', [])
    gl = [glass(f) for f in fs]
    fo = [four(f) for f in fs]
    tops = [re.search(r'Steinarr top R(\S+) falls (\d+)', f) for f in fs]
    topped = [int(m.group(1)) for m in tops if m and m.group(1) != '-']
    falls = sum(int(m.group(2)) for m in tops if m) / max(1, len(fs))
    kings = sum(1 for f in fs if f.startswith('lost') and re.search(r'Pyro 0/', f))
    s = '%-9s won %2d lost %2d (king fell %d) other %d  rounds %4.1f  the four HP left %3.0f%%  four downs/fight %.2f  glass left %3.0f/120 (whole in %d)  Steinarr topped out %d/%d (R%.1f), falls/fight %.2f' % (
        tag, r['won'], r['lost'], kings, r['other'], r['avgRounds'], 100 * sum(a for a, b in fo) / max(1, len(fo)), sum(b for a, b in fo) / max(1, len(fo)),
        sum(gl) / max(1, len(gl)), sum(1 for g in gl if g == 120), len(topped), len(fs), sum(topped) / max(1, len(topped)), falls)
    if r.get('errors'):
        s += '\n    ERRORS: ' + ' || '.join(e.replace('\n', ' ')[:400] for e in r['errors'])
    return s


def short(f):
    """a fight's line, cut to what matters: the result, the giants, the glass, the four, the tracker"""
    head = f.split(' ', 2)[:2]
    keep = []
    for part in re.findall(r"(Hallv\S+ \d+/\d+|Steinarr \d+/\d+|the skylight over the Sunshaft \d+/\d+|Pyro \d+/\d+|Barley \d+/\d+|Aurdin \d+/\d+|Vivian \d+/\d+|Lymen \d+/\d+)", f):
        keep.append(part.replace('the skylight over the Sunshaft', 'glass'))
    tr = re.search(r'\{(.*)\}', f)
    return ' '.join(head) + '  ' + ', '.join(keep) + ('\n          ' + tr.group(1) if tr else '')


def main(argv):
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    lvls = [kw['lvl']] if kw.get('lvl') else ['6', '7']
    n, seed = kw.get('n', '8'), kw.get('seed', '1')
    _copy()
    try:
        for L in lvls:
            params = {'foes': 'fighter', 'lvl': '5', 'n': n, 'seed': seed, 'fight': 'edifice', 'flvl': L}
            if kw.get('log'):
                params['log'] = '1'
                if kw.get('logAt'):
                    params['logAt'] = kw['logAt']
            if kw.get('probe'):
                print(json.dumps(run(params, probe=True), indent=1))
                continue
            sides = []
            if kw.get('smart', '1') == '1':
                sides.append(('smart', True))
            if kw.get('base', '1') == '1':
                sides.append(('class', False))
            for tag, sm in sides:
                r = run(params, smart=sm)
                print(summary('L%s %s' % (L, tag), r))
                if kw.get('fights', '1') == '1':
                    print('\n'.join('      ' + short(x) for x in r.get('fights', [])))
                if kw.get('log') and r.get('log'):
                    out = os.path.join(HERE, 'skylights-%s-log-L%s.txt' % (tag, L))
                    open(out, 'w', encoding='utf-8').write('\n'.join(r['log']))
                    print('    the log: ' + out)
                sys.stdout.flush()
    finally:
        try:
            os.remove(COPY)
        except OSError:
            pass


if __name__ == '__main__':
    main(sys.argv[1:])
