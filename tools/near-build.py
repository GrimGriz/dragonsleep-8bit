"""THE SILVERTON AREA BAKE (10-22, the world map seat; RULED, Griz, on the seat's lean: "2 - 1.5 mile hexes", after his "3 - most of the world map is between
silverton and the other locations - so a zoom where its somewhere between 4-10 hexes to the fork in the road and a few more down to the glowseep. Whats a
good zoom that shows about what the old corridor map did?"): the Silverton area as a map of its own beside THE WORLD -- hexes a mile and a half across,
over the first game's corridor span (Silverton to the Pit, the west road's edge to the Verge), walked as THE WORLD is (deep16/js/world.js, its 'near' map).
Read from THE WORLD's own bake, never from the tool: data/world.js (the grounds' table, the places, the roads and rivers, the look) and data/world-fine.bin
(every 330 ft its ground, every eighth of a mile its height). Each hex takes the ground most of its 330 ft cells have, its second ground and that one's share,
a wet floor where most of it is wet, its height the mean of its eighths; a road's hexes are marked (a road walks where it goes, but the held Coldridge Route
up to The DOORS). The area is whole 5-mile hexes of THE WORLD (NEAR_BOX), so its edge is theirs and a step off it is a step onto THE WORLD.
Writes deep16/data/world-near.js (D16.WORLD_NEAR). Run after tools/world-build.py (it calls this at its end); then python tools/deep16-build.py."""
import json, math, os, re, struct, sys, zlib
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
NEAR_MI = 1.5
NEAR_BOX = (70.0, 150.0, 12.0, 96.0) # (miles: the 5-mile hexes whose middles lie in it -- the corridor's span: 64 x 58 of its tiles at 1.1 to 1.5 mi a step)
S3 = math.sqrt(3)
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def axial(x, y, w):
    """the hex a point is in (world.js `at`, for arrays or numbers)"""
    r = y / (w * S3 / 2); X = x / w - r / 2; Z = r; Y = -X - Z
    rx, ry, rz = np.round(X), np.round(Y), np.round(Z)
    dx, dy, dz = np.abs(rx - X), np.abs(ry - Y), np.abs(rz - Z)
    a = (dx > dy) & (dx > dz); b = ~a & (dy > dz); c = ~a & ~b
    rx = np.where(a, -ry - rz, rx); rz = np.where(c, -rx - ry, rz)
    return rx.astype(np.int64), rz.astype(np.int64)


def centre(q, r, w): return (w * (q + r / 2.0), w * S3 / 2 * r)


def main():
    s = open(os.path.join(ROOT, 'deep16', 'data', 'world.js'), encoding='utf-8').read()
    B = json.loads(s[s.index('.WORLD = ') + 9:s.rindex('}') + 1])
    raw = zlib.decompress(open(os.path.join(ROOT, 'deep16', 'data', 'world-fine.bin'), 'rb').read())
    hl = struct.unpack('<I', raw[:4])[0]; hd = json.loads(raw[4:4 + hl]); o = 4 + hl
    w, h, hw, hh = hd['w'], hd['h'], hd['hw'], hd['hh']
    T = np.frombuffer(raw[o:o + w * h], dtype=np.uint8).reshape(h, w); o += w * h
    lo = np.frombuffer(raw[o:o + hw * hh], dtype=np.uint8).astype(np.uint16); o += hw * hh
    hi = np.frombuffer(raw[o:o + hw * hh], dtype=np.uint8).astype(np.uint16)
    H = np.cumsum((lo | (hi << 8)).view(np.int16).reshape(hh, hw).astype(np.int64), axis=1).astype(np.float64)
    keys = hd['keys']; NK = len(keys)
    # the area: THE WORLD's 5-mile hexes whose middles lie in the box
    W5 = B['hexMi']; world = {(e[0], e[1]): e for e in B['hexes']}
    area = sorted(k for k in world if NEAR_BOX[0] <= centre(k[0], k[1], W5)[0] <= NEAR_BOX[1] and NEAR_BOX[2] <= centre(k[0], k[1], W5)[1] <= NEAR_BOX[3])
    inarea = set(area)
    # every 330 ft cell in the box, to its hex of a mile and a half -- kept if its 5-mile hex is in the area
    X0, X1, Y0, Y1 = NEAR_BOX[0] - 5, NEAR_BOX[1] + 5, NEAR_BOX[2] - 5, NEAR_BOX[3] + 5
    i0, i1 = max(0, int((X0 - hd['x0']) / hd['mi'])), min(w, int((X1 - hd['x0']) / hd['mi']))
    j0, j1 = max(0, int((Y0 - hd['y0']) / hd['mi'])), min(h, int((Y1 - hd['y0']) / hd['mi']))
    jj, ii = np.mgrid[j0:j1, i0:i1]; cx = hd['x0'] + (ii + 0.5) * hd['mi']; cy = hd['y0'] + (jj + 0.5) * hd['mi']
    q5, r5 = axial(cx, cy, W5)
    keep = np.zeros(q5.shape, dtype=bool)
    for (a, b) in area: keep |= (q5 == a) & (r5 == b)
    qn, rn = axial(cx, cy, NEAR_MI); t = T[j0:j1, i0:i1]
    qn, rn, t = qn[keep], rn[keep], t[keep]
    qmin, rmin = qn.min(), rn.min(); RN = rn.max() - rmin + 1
    key = (qn - qmin) * RN + (rn - rmin); NH = int(key.max()) + 1
    cnt = np.bincount(key * NK + (t & 127), minlength=NH * NK).reshape(NH, NK)
    wet = np.bincount(key, weights=((t & 128) > 0).astype(np.float64), minlength=NH)
    tot = cnt.sum(axis=1)
    # the heights: each eighth of a mile to its hex
    hj, hi_ = np.mgrid[0:hh, 0:hw]; hx = hd['x0'] + (hi_ + 0.5) * hd['mi'] * hd['hs']; hy = hd['y0'] + (hj + 0.5) * hd['mi'] * hd['hs']
    sel = (hx >= X0) & (hx <= X1) & (hy >= Y0) & (hy <= Y1)
    hq, hr = axial(hx[sel], hy[sel], NEAR_MI); hk = (hq - qmin) * RN + (hr - rmin); ok = (hk >= 0) & (hk < NH) & ((hr - rmin) >= 0) & ((hr - rmin) < RN)
    hsum = np.bincount(hk[ok], weights=H[sel][ok], minlength=NH); hcnt = np.bincount(hk[ok], minlength=NH)
    hexes = {}
    for k in np.nonzero(tot)[0]:
        q, r = int(k // RN + qmin), int(k % RN + rmin)
        c = cnt[k]; order = np.argsort(-c, kind='stable'); g1 = int(order[0]); g2 = int(order[1]); n = float(tot[k])
        hgt = float(hsum[k] / hcnt[k]) if hcnt[k] else 0.0
        sh2 = round(float(c[g2]) / n, 2)
        hexes[(q, r)] = [q, r, keys[g1], round(hgt), 1 if wet[k] > n / 2 else 0, keys[g2] if sh2 >= 0.05 else None, sh2 if sh2 >= 0.05 else 0, 0, 0]
    # the places at their hexes; the roads and rivers as chains of neighbouring hexes, the roads' hexes marked
    sites = []
    for S in B['sites']:
        S2 = dict(S); a = axial(S['x'], S['y'], NEAR_MI); S2['hex'] = [int(a[0]), int(a[1])]; sites.append(S2)
    def chain(pts):
        out = []
        for a, b in zip(pts, pts[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L / 0.05))
            for k in range(n + 1):
                x = a[0] + (b[0] - a[0]) * k / n; y = a[1] + (b[1] - a[1]) * k / n; qq, rr = axial(x, y, NEAR_MI); c = (int(qq), int(rr))
                if out and out[-1] == c: continue
                if out:
                    p = out[-1]; d = (c[0] - p[0], c[1] - p[1])
                    if d not in DIRS: # (a corner crossed: the neighbour of both nearest the way)
                        both = [(p[0] + e[0], p[1] + e[1]) for e in DIRS if (c[0] - p[0] - e[0], c[1] - p[1] - e[1]) in DIRS]
                        if both: out.append(min(both, key=lambda m: math.hypot(centre(m[0], m[1], NEAR_MI)[0] - x, centre(m[0], m[1], NEAR_MI)[1] - y)))
                out.append(c)
        return out
    paths = []
    for P in B['paths']:
        P2 = dict(P); hx2 = [c for c in chain(P['pts']) if c in hexes]
        P2['hexes'] = [list(c) for i, c in enumerate(hx2) if i == 0 or hx2[i - 1] != c]
        if P['kind'] != 'river' and not re.search('coldridge', P.get('name') or '', re.I):
            for c in hx2: hexes[c][8] = 1
        paths.append(P2)
    N = {'v': 1, 'hexMi': NEAR_MI, 'from': B.get('from'), 'baked': B.get('baked'), 'saved': B.get('saved'), 'terr': B['terr'], 'look': B.get('look'),
         'hexes': [hexes[k] for k in sorted(hexes, key=lambda k: (k[1], k[0]))], 'sites': sites, 'paths': paths,
         'area': {'box': list(NEAR_BOX), 'hexes': [list(k) for k in area]}}
    text = ("/* THE SILVERTON AREA -- generated by tools/near-build.py from data/world.js and data/world-fine.bin (" + str(B.get('from')) + "): the second game's\n"
            "   Silverton area as hexes a mile and a half across, walked as THE WORLD is (deep16/js/world.js, its 'near' map). Never edit this. */\n"
            "'use strict';\n(window.D16 = window.D16 || {}).WORLD_NEAR = " + json.dumps(N, separators=(',', ':')) + ";\n")
    out = os.path.join(ROOT, 'deep16', 'data', 'world-near.js')
    old = open(out, encoding='utf-8').read() if os.path.exists(out) else None
    if old != text:
        with open(out, 'w', encoding='utf-8', newline='\n') as f: f.write(text)
        print('wrote deep16/data/world-near.js: %d hexes of %.1f mi over %d of THE WORLD\'s, %d KB' % (len(hexes), NEAR_MI, len(area), len(text) // 1024))
    else: print('deep16/data/world-near.js unchanged')
    return 0


if __name__ == '__main__':
    sys.exit(main())
