"""The Harbinger's pack, pre-benched (10-08, the GreyFang window): how many mirror hyenas his rise should call for a party of a given strength, so a
non-story fight with him lands near the ladder rung's ruled 47 of 100 (PATCHLOG b72232e: "Do Mirror Hyena bite +5 for 2d4+2 and call it good").

Griz, 10-08: "Hypothesize dynamic party assessment determine #of mirror hyena / Discuss pre-benching" -- then "if we later give them a nonstory version as an
easter egg present where greyfang or others is there - we'll hope the dynamic hyenas do the trick. feels like they might need a special ability as an extra
lever, let's prebench without".

    python dev/harbinger-pack.py            (from PowerShell: headless Edge; about twenty minutes)
    python dev/harbinger-pack.py n=4        (quicker, rougher)

A party's STRENGTH is the sum of its members' levels (a named one at its own: GreyFang 11). Each party below meets the Harbinger on the class floor
(dev/bench16.py harbinger vs=... lvl=...) with his pack held at each size (`callN`, js/traits.js nCall); for each party the size whose Harbinger wins come
nearest TARGET is its point, and the points, made never to fall as strength rises, are the table js/traits.js TR.PACK_TABLE reads (printed at the end, to paste).
Rerun it when the Harbinger, the mirror hyena or the classes change.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bench16

TARGET = 0.47
COUNTS = [0, 2, 4, 6, 8]
PARTIES = [
    ('GreyFang alone', 'greyfang:11', 7, 11),
    ('GreyFang and Lymen', 'greyfang:11,lymen:7', 7, 18),
    ('the four at 5', 'aurdin:5,vivian:5,barley:5,lymen:5', 5, 20),
    ('the four at 6', 'aurdin:6,vivian:6,barley:6,lymen:6', 6, 24),
    ('the four at 7', 'aurdin:7,vivian:7,barley:7,lymen:7', 7, 28),
    ('the four at 8', 'aurdin:8,vivian:8,barley:8,lymen:8', 8, 32),
    ('the four at 9', 'aurdin:9,vivian:9,barley:9,lymen:9', 9, 36),
    ('the four at 7 and GreyFang', 'aurdin:7,vivian:7,barley:7,lymen:7,greyfang:11', 7, 39),
]


def main(argv):
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    n = kw.get('n', '10')
    rows = []
    for name, vs, lvl, power in PARTIES:
        hw = {}
        for c in COUNTS:
            r = bench16.run({'foes': 'harbinger', 'vs': vs, 'lvl': str(lvl), 'n': n, 'seed': '1', 'callN': str(c)}, timeout=1800)
            if not isinstance(r, dict) or r.get('error') or r.get('errors'):
                print('  %s, pack %d: FAILED %s' % (name, c, str((r or {}).get('errors') or (r or {}).get('error'))[:200]), flush=True)
                hw[c] = None; continue
            tot = (r.get('won', 0) + r.get('lost', 0) + r.get('other', 0)) or 1
            hw[c] = r.get('lost', 0) / float(tot)            # (the bench counts from the party's side: its losses are his wins)
            print('  %-28s strength %2d, pack %d: the Harbinger wins %d%%' % (name, power, c, round(hw[c] * 100)), flush=True)
        ok = {c: v for c, v in hw.items() if v is not None}
        best = min(ok, key=lambda c: (abs(ok[c] - TARGET), c)) if ok else None
        rows.append({'party': name, 'strength': power, 'wins': hw, 'pack': best})
    pts, last = [], 0
    for r in sorted(rows, key=lambda r: r['strength']):
        p = max(last, r['pack'] if r['pack'] is not None else last); pts.append([r['strength'], p]); last = p
    out = {'target': TARGET, 'n': n, 'rows': rows, 'table': pts}
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'harbinger-pack.json')
    json.dump(out, open(path, 'w'), indent=1)
    print('\nTR.PACK_TABLE = %s;   // [strength, hyenas]: the pre-bench, %s fights a cell, target %d%%' % (json.dumps(pts), n, round(TARGET * 100)))
    print('written', path)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
