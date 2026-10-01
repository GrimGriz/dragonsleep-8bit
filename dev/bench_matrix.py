"""The class bench's table (handoff-2026-09-28-npc-classes-to-six.md §3D): every class against every class one on one, and every class
as a band of four against the four, at levels 1-6, in headless Edge (dev/bench16.py). Writes deep16-class-bench.md at the repo root
(the reading-lamp's way: no tables' pipes needed to read it, but tables for the eye).
  python dev/bench_matrix.py [n=10] [levels=1-6]"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bench16

CL = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
AB = {'barbarian': 'Bbn', 'bard': 'Brd', 'cleric': 'Clr', 'druid': 'Drd', 'fighter': 'Ftr', 'monk': 'Mnk', 'paladin': 'Pal', 'ranger': 'Rgr', 'rogue': 'Rog', 'sorcerer': 'Sor', 'warlock': 'Wlk', 'wizard': 'Wiz'}


def main(argv):
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    n = int(kw.get('n', '10'))
    lo, hi = [int(x) for x in kw.get('levels', '1-6').split('-')]
    out = []
    out.append('---')
    out.append('layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels %d-%d, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. %d fights a matchup.' % (lo, hi, n))
    out.append('written: %s by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=%d' % (time.strftime('%Y-%m-%d %H:%MZ', time.gmtime()), n))
    out.append('reading: a duel cell is the row class\'s wins out of %d against the column class (the rest the column\'s, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder\'s fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.' % n)
    out.append('---')
    out.append('')
    out.append('# The class bench')
    allerr = []
    summary = {c: [0, 0] for c in CL}
    for L in range(lo, hi + 1):
        t0 = time.time()
        r = bench16.run({'mode': 'matrix', 'lvl': str(L), 'n': str(n)}, timeout=1800)
        if 'error' in r:
            out.append('\n## Level %d\n\nFAILED: %s' % (L, r))
            continue
        d = r['duel']
        out.append('')
        out.append('## Level %d  (%.0f s)' % (L, time.time() - t0))
        out.append('')
        out.append('| row beats column | ' + ' | '.join(AB[c] for c in CL) + ' | total |')
        out.append('|---|' + '---|' * (len(CL) + 1))
        for a in CL:
            cells, tot, games = [], 0, 0
            for b in CL:
                if a == b:
                    cells.append('-'); continue
                if a + '>' + b in d:
                    w = d[a + '>' + b][0]
                else:
                    w = d[b + '>' + a][1]
                cells.append(str(w)); tot += w; games += n
            summary[a][0] += tot; summary[a][1] += games
            out.append('| **%s** | %s | %d%% |' % (a, ' | '.join(cells), round(100.0 * tot / max(1, games))))
        out.append('')
        out.append('Bands of four against the four (the band\'s wins of %d, the rounds):' % n)
        out.append('')
        out.append(', '.join('%s %d (%.1f)' % (c, r['band'][c][0], r['band'][c][2]) for c in CL))
        for e in r.get('errors', []):
            allerr.append('L%d: %s' % (L, e))
        print('level', L, 'done', round(time.time() - t0), 's', flush=True)
    out.append('')
    out.append('## Across the levels')
    out.append('')
    out.append('One on one, all levels: ' + ', '.join('%s %d%%' % (c, round(100.0 * summary[c][0] / max(1, summary[c][1]))) for c in sorted(CL, key=lambda c: -summary[c][0])))
    out.append('')
    out.append('## Errors')
    out.append('')
    out.append('\n'.join('- ' + e.replace('\n', ' ')[:300] for e in allerr) if allerr else 'None thrown.')
    p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'deep16-class-bench.md')
    open(p, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('wrote', p)


if __name__ == '__main__':
    main(sys.argv[1:])
