"""One command, green or red (10-01b: the gate question, Griz: "the gate bit is about how we're just constantly changing the live version
of the game and that's a bad way to do things?" -- the seat's call: no deploy gate while he is the only player, but no push on red).
The after-every-edit benches in one run; exit 0 green, 1 red. From PowerShell (headless Edge answers nothing from the Bash sandbox).

  python dev/check.py          quick: the every-spell check, three fights, five modes (about a minute)
  python dev/check.py all      every mode in bench16.js, the 8-bit battle benches, the wet and Pyro probes
"""
import os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

SPELLS_BY_DESIGN = {'calllightning', 'plantgrowth', 'conjurewoodlandbeings'}  # no sky, no plants, nothing to answer
QUICK_FIGHTS = [
    {'foes': 'x', 'fight': 'brood', 'lvl': '5', 'n': '2', 'seed': '1'},
    {'foes': 'cleric:9,wizard:9', 'lvl': '9', 'n': '4', 'seed': '1'},
    {'foes': 'goblin,goblin,goblin', 'vs': 'wizard,wizard,wizard', 'lvl': '5', 'n': '4', 'seed': '1'},
]
QUICK_MODES = ['rulings0930', 'features', 'charms', 'walls', 'familiar', 'globe1001c', 'ring1001c', 'sleep1001c', 'tendrils1002', 'ready1002', 'ready1002b', 'dispel1002', 'joke1002', 'pocket1002', 'fixes1003', 'lazy1003']
ALL_MODES = ['items', 'lantern', 'ledgerlamp', 'druid12', 'rulings0930', 'featurewalk', 'ring0930', 'campcast', 'druidlast', 'charms',
             'walls', 'zones', 'subs', 'auras', 'familiar', 'features', 'matrix', 'globe1001c', 'ring1001c', 'sleep1001c', 'show', 'tendrils1002', 'ready1002', 'ready1002b', 'dispel1002', 'joke1002', 'pocket1002', 'fixes1003', 'lazy1003']
ALL_SCRIPTS = [['dev/bench8.py', 'lymen'], ['dev/bench8.py', 'ingrith'], ['dev/bench8.py', 'sheets1001c'], ['dev/bench8.py', 'srd1002'], ['dev/bench8.py', 'familiar'], ['dev/bench8.py', 'ledgerlamp8'], ['dev/bench8.py', 'ledgerlamp8seam'], ['dev/bench8.py', 'fixes1003'], ['dev/bench8.py', 'reactions1003'], ['dev/bench8.py', 'wet3'],
               ['dev/wet-probe.py'], ['dev/wet8-probe.py'], ['dev/pyro-probe.py'], ['dev/pyro8-probe.py'], ['dev/srdleft-probe.py'],
               ['dev/keeper-probe.py'], # (10-03, the stream's fixes: the Keeper's own probe, its fixes' checks in it -- the retreat, the break-free, the swirl's end, the prone rules, the opener, the log, the card)
               ['dev/walk8.py', 'leg=gulch', 'n=1', 'check']] # (here-to-there, 10-03: one walk of the shortest leg sure to meet a fight -- 35 steps in the gulch's zone against a countdown of at most 26 -- so the walker can't rot)


def spells():
    r = bench16.run({'mode': 'spells'})
    if 'error' in r:
        return ['spells: LOAD FAILED ' + str(r)[:300]]
    bad = [e for e in r.get('errors', []) if e.split(':')[0].strip() not in SPELLS_BY_DESIGN]
    return ['spells: ' + e[:300] for e in bad]


def fight(p):
    r = bench16.run(p)
    name = p['foes'] + (' fight=' + p['fight'] if p.get('fight') else '') + (' vs=' + p['vs'] if p.get('vs') else '')
    if 'error' in r:
        return [name + ': LOAD FAILED ' + str(r)[:300]]
    return [name + ': ' + e.replace('\n', ' ')[:300] for e in r.get('errors') or []]


MODE_FOES = {'items': 'fighter:5', 'show': 'grick,xorn,roper'}  # (a mode that fights its foes wants real ones; the rest set up their own. show: the Blender monsters on the test ground, every row twice -- 10-02)


def mode(m):
    r = bench16.run({'foes': MODE_FOES.get(m, 'x'), 'mode': m, 'lvl': '5', 'n': '1', 'seed': '1'}, timeout=900)
    if 'error' in r:
        return [m + ': LOAD FAILED ' + str(r)[:300]]
    out = [m + ': ' + c[:300] for c in r.get('checks', []) if c.startswith('FAIL')]
    out += [m + ': ' + str(e).replace('\n', ' ')[:300] for e in r.get('errors') or []]
    return out


def script(cmd):
    p = subprocess.run([sys.executable] + cmd, cwd=ROOT, capture_output=True, timeout=900)
    txt = p.stdout.decode('utf-8', 'replace') + p.stderr.decode('utf-8', 'replace')
    bad = [l for l in txt.splitlines() if re.search(r'\bFAIL|Traceback|LOADERR|Error:', l)]
    if p.returncode and not bad:
        bad = ['exit ' + str(p.returncode) + ': ' + txt.strip().splitlines()[-1][:200] if txt.strip() else 'exit ' + str(p.returncode)]
    return [' '.join(cmd) + ': ' + l[:300] for l in bad]


def main(argv):
    full = 'all' in argv
    jobs = [('spells', spells, None)] + [('fight', fight, p) for p in QUICK_FIGHTS] + [('mode ' + m, mode, m) for m in (ALL_MODES if full else QUICK_MODES)]
    t0 = time.time()
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: (j[0], j[1](j[2]) if j[2] is not None else j[1]()), jobs))
    if full: # (one at a time: the 8-bit bench and the probes each write a page by a fixed name)
        res += [(' '.join(c), script(c)) for c in ALL_SCRIPTS]
        jobs += ALL_SCRIPTS
    red = [line for _, lines in res for line in lines]
    for name, lines in res:
        print(('RED   ' if lines else 'ok    ') + name)
    for line in red:
        print('  ' + line)
    print('%s  (%d checks, %.0f s)' % ('RED' if red else 'GREEN', len(jobs), time.time() - t0))
    sys.exit(1 if red else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
