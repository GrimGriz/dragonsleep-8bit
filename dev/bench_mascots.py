"""The Mascot bench (the MPMon lane §3.2; Griz, 10-07: "Bench them vs the story party please"): the four Mascots (Denny, Beholda, Rascal,
Goose; deep16/js/mpmon.js) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen), and each Mascot one on one against each hero,
at levels 1-9, in headless Edge (dev/bench16.py mode=mascots). Twice: the heroes as the ladder's fixture (max hit dice, their magic weapons
from 5 -- the class bench's band, so its lines stand beside these), and on the NPCs' average HP (avghp=1), even footing. Writes
deep16-mascot-bench.md at the repo root, with what each Mascot's action and bonus specials went to in the band fights (10-07, his worry about Beholda after 5th).
  python dev/bench_mascots.py [n=20] [nd=10] [levels=1-9]"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bench16

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = ['denny', 'beholda', 'rascal', 'goose']
HS = ['barley', 'aurdin', 'vivian', 'lymen']
NM = {k: k.capitalize() for k in MS + HS}


def class_bands():
    """the class bench's band lines by level (deep16-class-bench.md): {lvl: {class: (wins, rounds)}}"""
    out, lvl = {}, None
    try:
        for line in open(os.path.join(ROOT, 'deep16-class-bench.md'), encoding='utf-8'):
            m = re.match(r'## Level (\d+)', line)
            if m:
                lvl = int(m.group(1)); continue
            if lvl and re.match(r'^barbarian \d+ \(', line):
                out[lvl] = {c: (int(w), float(r)) for c, w, r in re.findall(r'(\w+) (\d+) \(([\d.]+)\)', line)}
    except OSError:
        pass
    return out


def acts(d):
    """{what: count} -> 'strikes 8, THE BIG SCREEN 3' (most first)"""
    return ', '.join('%s %d' % (k, v) for k, v in sorted(d.items(), key=lambda kv: -kv[1]))


def shares(d):
    """{what: count} -> 'strikes 53%, BIG SCREEN 20%' (the three most)"""
    t = float(sum(d.values())) or 1
    return ', '.join('%s %d%%' % (k.replace('THE ', ''), round(100 * v / t)) for k, v in sorted(d.items(), key=lambda kv: -kv[1])[:3])


def main(argv):
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    n, nd = int(kw.get('n', '20')), int(kw.get('nd', '10'))
    lo, hi = [int(x) for x in kw.get('levels', '1-9').split('-')]
    cb = class_bands()
    res = {}
    for pas in ('fixture', 'avghp'):
        for L in range(lo, hi + 1):
            t0 = time.time()
            q = {'mode': 'mascots', 'lvl': str(L), 'n': str(n), 'nd': str(nd)}
            if pas == 'avghp':
                q['avghp'] = '1'
            r = bench16.run(q, timeout=1800)
            r['secs'] = round(time.time() - t0)
            res[(pas, L)] = r
            print(pas, 'level', L, r.get('band'), round(time.time() - t0), 's', flush=True)
    json.dump({'%s:%d' % k: v for k, v in res.items()}, open(os.path.join(ROOT, 'dev', 'bench_mascots.json'), 'w'), indent=0)
    out = ['---',
           'layer: the Mascot bench (dev/bench_mascots.py; the MPMon lane §3.2; Griz, 10-07: *"Bench them vs the story party please"*). The four Mascots of deep16/js/mpmon.js (Denny, Beholda, Rascal, Goose) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen) at the same level, and each one on one against each hero, levels %d-%d, every side run by the class AI in headless Edge. %d band fights a level, %d a duel.' % (lo, hi, n, nd),
           'written: %s by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_mascots.py n=%d nd=%d' % (time.strftime('%Y-%m-%d %H:%MZ', time.gmtime()), n, nd),
           'reading: the band line is the Mascots\' wins of %d against the four (the rest the heroes\', or neither), its rounds, and beside it the class bench\'s bands at that level (four of a class against the same four, of 10). Twice: the heroes as the ladder\'s fixture (max hit dice, their magic weapons from 5 -- as the class bench), then on the NPCs\' average HP (avghp=1, even footing: the Mascots are NPCs and roll average). A duel cell is the Mascot\'s wins of %d against that hero. What the actions went to (since 10-07, his worry that Beholda only Big-Screens after 5th): the class AI\'s pick for each Mascot\'s action, and the bonus specials as they fired, counted over the band fights. Estimates of the AI, not of the kits: a move the AI spends badly reads weak.' % (n, nd),
           '---', '', '# The Mascot bench', '']
    # the summary first
    out.append('## At a glance')
    out.append('')
    out.append('| level | the band vs the four (fixture) | (average HP) | the class bands at that level, best and worst | Denny 1v1 | Beholda 1v1 | Rascal 1v1 | Goose 1v1 |')
    out.append('|---|---|---|---|---|---|---|---|')
    for L in range(lo, hi + 1):
        f, a = res.get(('fixture', L), {}), res.get(('avghp', L), {})
        if 'band' not in f:
            out.append('| %d | FAILED %s | | | | | | |' % (L, str(f)[:80])); continue
        bands = cb.get(L, {})
        srt = sorted(bands.items(), key=lambda kv: -kv[1][0])
        ctx = ('%s %d, %s %d; median %d' % (srt[0][0], srt[0][1][0], srt[-1][0], srt[-1][1][0], sorted(v[0] for v in bands.values())[len(bands) // 2])) if bands else '--'
        duel = lambda m: '%d%%' % round(100.0 * sum(f['duel'][m + '>' + h][0] for h in HS) / (4 * nd))
        out.append('| %d | **%d of %d** (%.1f rounds) | %s | %s | %s | %s | %s | %s |' % (
            L, f['band'][0], n, f['band'][2], ('%d of %d' % (a['band'][0], n)) if 'band' in a else '--', ctx, duel('denny'), duel('beholda'), duel('rascal'), duel('goose')))
    out.append('')
    if any(res.get(('fixture', L), {}).get('acts') for L in range(lo, hi + 1)):
        out.append('## What the actions went to (the band fights, fixture; the three most of each one\'s actions, by share)')
        out.append('')
        out.append('| level | Denny | Beholda | Rascal | Goose |')
        out.append('|---|---|---|---|---|')
        for L in range(lo, hi + 1):
            f = res.get(('fixture', L), {})
            if f.get('acts'):
                out.append('| %d | %s |' % (L, ' | '.join(shares(f['acts'].get(NM[m], {})) or '--' for m in MS)))
        out.append('')
    for L in range(lo, hi + 1):
        f = res.get(('fixture', L), {})
        if 'band' not in f:
            continue
        out.append('## Level %d  (%d s)' % (L, f['secs']))
        out.append('')
        out.append('The band: the Mascots won %d of %d, the heroes %d, %.1f rounds (on average HP: %s).' % (
            f['band'][0], n, f['band'][1], f['band'][2], ('%d, the heroes %d' % tuple(res[('avghp', L)]['band'][:2])) if 'band' in res.get(('avghp', L), {}) else '--'))
        out.append('')
        dealt, taken, down, left = f.get('dealt', {}), f.get('taken', {}), f.get('down', {}), f.get('left', {})
        pools, lB, lA = f.get('pools'), f.get('leftB', {}), f.get('leftA', {})
        def lefts(k):
            if k not in MS:
                return ''
            if pools:
                return ', specials left %.1f of %d bonus / %.1f of %d action' % (lB.get(NM[k], 0), pools[MS.index(k)][0], lA.get(NM[k], 0), pools[MS.index(k)][1])
            return ', specials left %.1f of %d' % (left.get(NM[k], 0), f['specials'][MS.index(k)])
        out.append('In the band fights, a fight: ' + '; '.join('%s dealt %d, took %d, down %.1f%s' % (
            NM[k], round(dealt.get(NM[k], 0) / n), round(taken.get(NM[k], 0) / n), down.get(NM[k], 0) / n, lefts(k)) for k in MS + HS) + '.')
        out.append('')
        if f.get('acts'):
            out.append('What their turns went to in the band fights (all %d fights together; a turn is one taken standing):' % n)
            out.append('')
            for k in MS:
                out.append('- **%s**, %d turns: the action %s; the bonus specials %s.' % (NM[k], f.get('turns', {}).get(NM[k], 0), acts(f['acts'].get(NM[k], {})), acts(f.get('bonus', {}).get(NM[k], {})) or 'none'))
            out.append('')
        out.append('| one on one: the Mascot\'s wins of %d | Barley | Aurdin | Vivian | Lymen | total |' % nd)
        out.append('|---|---|---|---|---|---|')
        for m in MS:
            cells = [f['duel'][m + '>' + h] for h in HS]
            out.append('| **%s** | %s | %d%% |' % (NM[m], ' | '.join('%d (%.0f r)' % (c[0], c[2]) for c in cells), round(100.0 * sum(c[0] for c in cells) / (4 * nd))))
        a = res.get(('avghp', L), {})
        if 'duel' in a:
            out.append('')
            out.append('On average HP, one on one: ' + ', '.join('%s %d%%' % (NM[m], round(100.0 * sum(a['duel'][m + '>' + h][0] for h in HS) / (4 * nd))) for m in MS) + '.')
        if f.get('errors'):
            out.append('')
            out.append('Errors: ' + ' / '.join(e.replace('\n', ' ')[:200] for e in f['errors']))
        out.append('')
    open(os.path.join(ROOT, 'deep16-mascot-bench.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('wrote deep16-mascot-bench.md')


if __name__ == '__main__':
    main(sys.argv[1:])
