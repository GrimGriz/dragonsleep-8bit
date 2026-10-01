"""Why the fights are easy (09-28g, Griz: "is the ease a gear issue, AI issue, or 5v4 issue?"): the same fights with one factor
changed at a time. Both sides always run the one class AI (js/tactics.js), so 'the AI' is tested by what it does for each side.
Writes dev/ease-runs.txt. Run from PowerShell (headless Edge)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bench16 as b

N = os.environ.get('N', '40')
NAMED = 'talmok,willem,katarina,torvald'
MIRROR = 'fighter:5,wizard:5,rogue:5,paladin:5'
runs = [
    ('the watched fight: the four (L5) vs Talmok, Willem, Kat, Torvald', {'foes': NAMED}),
    ('  ... the four with plain weapons, no splint', {'foes': NAMED, 'plain': '1'}),
    ('  ... the four at average HP', {'foes': NAMED, 'avghp': '1'}),
    ('  ... both', {'foes': NAMED, 'plain': '1', 'avghp': '1'}),
    ('  ... the named four\'s classes at L5, generic (Talmok 5 not 3)', {'foes': 'barbarian:5,wizard:5,cleric:5,cleric:5'}),
    ('mirror: the four vs their own classes as generic L5 NPCs', {'foes': MIRROR}),
    ('  ... the four with plain weapons, no splint', {'foes': MIRROR, 'plain': '1'}),
    ('  ... the four at average HP', {'foes': MIRROR, 'avghp': '1'}),
    ('  ... both (the four\'s sheets as the NPCs\' rules would make them)', {'foes': MIRROR, 'plain': '1', 'avghp': '1'}),
    ('NPC mirror: generic hero classes vs generic hero classes (no hero sheets at all)', {'foes': MIRROR, 'vs': MIRROR}),
    ('numbers: the four vs five (the mirror + a fighter)', {'foes': MIRROR + ',fighter:5'}),
    ('numbers: the four vs five, plain + average HP', {'foes': MIRROR + ',fighter:5', 'plain': '1', 'avghp': '1'}),
]
out = []
for title, p in runs:
    q = {'lvl': '5', 'n': N, 'seed': '3'}
    q.update(p)
    r = b.run(q)
    if 'error' in r:
        line = '%s\n    FAILED %s' % (title, str(r)[:200])
    else:
        line = '%s\n    won %d lost %d other %d  rounds %.1f  party HP left %s%%  party downs a fight %s%s' % (
            title, r['won'], r['lost'], r['other'], r['avgRounds'], r.get('partyLeft'), r.get('partyDowns'),
            ('  ERRORS ' + ' | '.join(r['errors'])[:200]) if r.get('errors') else '')
    print(line, flush=True)
    out.append(line)
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ease-runs.txt'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
