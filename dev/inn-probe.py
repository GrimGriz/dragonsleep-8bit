"""The Halfway Inn's probe (11-04, the Inn build seat 2; the Halfway Inn lane's section 10.6 item 11 and deep16/signature-fights.md's "accurate bench as build order"):
Gennet on the path (the second act's beat 3, js/secondact.js) seeded a level -- the party by the class AI, her numbers as written (the SRD Cult Fanatic, a cleric 4),
the child between them, STRIKE and then TAKE THE CHILD -- a table of how it ends (yielded at half, killed past the yield, or neither), the rounds, the party's
downs, whether a boy was caught and Doran came. The second act's own checks run first (dev/bench16.js mode=secondact1104) and a FAIL there is RED here.

  python dev/inn-probe.py                 the checks, then 6 seeds at 3rd and 4th
  python dev/inn-probe.py n=12 lvl=4      twelve seeds at 4th only
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

def arg(k, d):
    for a in sys.argv[1:]:
        if a.startswith(k + '='): return a.split('=', 1)[1]
    return d

def main():
    bad = 0
    r = bench16.run({'foes': 'x', 'mode': 'secondact1104', 'lvl': '5', 'n': '1', 'seed': '1'}, timeout=900)
    if 'error' in r:
        print('FAIL the second act\'s checks did not run: ' + str(r)[:300]); print('no result'); return 1
    for c in r.get('checks', []):
        print(c[:220]); bad += c.startswith('FAIL')
    for e in r.get('errors') or []:
        print('FAIL ' + str(e)[:300]); bad += 1
    n = int(arg('n', '6')); lvls = [arg('lvl', None)] if arg('lvl', None) else ['3', '4']
    seeds = ','.join(str((k + 1) * 7919) for k in range(n))
    print('\nGennet on the path, STRIKE then TAKE THE CHILD (the party by the class AI; the SRD Cult Fanatic as written)')
    print('%-6s %-4s %-8s %-7s %-6s %-6s %s' % ('seed', 'lvl', 'end', 'rounds', 'downs', 'doran', 'offering'))
    for L in lvls:
        rr = bench16.run({'foes': 'x', 'mode': 'secondact1104', 'probe': '1', 'seeds': seeds, 'lvl': L, 'n': '1'}, timeout=900)
        if 'error' in rr:
            print('FAIL the probe at %s: %s' % (L, str(rr)[:200])); bad += 1; continue
        for row in rr.get('table', []):
            print('%-6s %-4s %-8s %-7s %-6s %-6s %s' % (row['seed'], row['lvl'], row['end'], row['rounds'], row['downs'], 'yes' if row['doran'] else '-', row['offering']))
        if not rr.get('table'):
            print('FAIL no rows at %s' % L); bad += 1
    print('\n' + ('RED  %d' % bad if bad else 'GREEN'))
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
