"""THE WORLD'S LAND, PROBED (11-03 night, the mountain seat): checks on the baked land itself -- deep16/data/world-fine.bin (every 330 ft its ground, every eighth
of a mile its height), deep16/data/world-near.js (the Silverton area's hexes), deep16/data/world.js -- read with numpy as tools/near-build.py reads them; no
browser (the benches' page never unpacks the land). In the quick gate (dev/check.py QUICK_SCRIPTS). Prints ok / FAIL lines; exits 1 on a FAIL.

  python dev/world-probe.py

THE MOUNTAIN PULLED BACK (Griz, 11-03 2222Z, on eyes-edifice-1103: "I think it might be worthwhile to reshape the area to better match the hex lines, such that
when traveling between town and the warrens on the world map, half of the selected hexes aren't up the side of the mountain"; then "have it try the pulling the
mountain back, preferably without the surrounding area becoming malformed"): tools/hexmap.js seedWarrensFoot, a mountain's foot (footW) along the north edge of
the area's row from the town to the Warrens."""
import json, math, os, struct, sys, zlib
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
S3 = math.sqrt(3)
fails = []


def ok(what, v):
    print(('ok   ' if v else 'FAIL ') + what)
    if not v: fails.append(what)


def axial(x, y, w):
    r = y / (w * S3 / 2); X = x / w - r / 2; Z = r; Y = -X - Z
    rx, ry, rz = np.round(X), np.round(Y), np.round(Z)
    dx, dy, dz = np.abs(rx - X), np.abs(ry - Y), np.abs(rz - Z)
    a = (dx > dy) & (dx > dz); b = ~a & (dy > dz); c = ~a & ~b
    rx = np.where(a, -ry - rz, rx); rz = np.where(c, -rx - ry, rz)
    return rx.astype(np.int64), rz.astype(np.int64)


def load():
    raw = zlib.decompress(open(os.path.join(ROOT, 'deep16', 'data', 'world-fine.bin'), 'rb').read())
    hl = struct.unpack('<I', raw[:4])[0]; hd = json.loads(raw[4:4 + hl]); o = 4 + hl + hd['w'] * hd['h']; hn = hd['hw'] * hd['hh']
    lo = np.frombuffer(raw[o:o + hn], dtype=np.uint8).astype(np.uint16); hi = np.frombuffer(raw[o + hn:o + 2 * hn], dtype=np.uint8).astype(np.uint16)
    H = np.cumsum((lo | (hi << 8)).view(np.int16).reshape(hd['hh'], hd['hw']).astype(np.int64), axis=1).astype(np.float64)
    js = lambda f, tag: (lambda s: json.loads(s[s.index(tag) + len(tag):s.rindex('}') + 1]))(open(os.path.join(ROOT, 'deep16', 'data', f), encoding='utf-8').read())
    return hd, H, js('world-near.js', '.WORLD_NEAR = '), js('world.js', '.WORLD = ')


def main():
    hd, H, N, B = load(); s = hd['mi'] * hd['hs']
    jj, ii = np.mgrid[0:hd['hh'], 0:hd['hw']]
    def box(x0, x1, y0, y1): # (the eighths whose middles lie in a box: their rows and columns)
        return slice(max(0, int((y0 - hd['y0']) / s)), int((y1 - hd['y0']) / s) + 1), slice(max(0, int((x0 - hd['x0']) / s)), int((x1 - hd['x0']) / s) + 1)
    def hexcells(q, r, w=1.5): # (the eighths of the land in one of the area's hexes)
        cx, cy = w * (q + r / 2.0), w * S3 / 2 * r; b = box(cx - 1, cx + 1, cy - 1, cy + 1)
        X = hd['x0'] + (ii[b] + 0.5) * s; Y = hd['y0'] + (jj[b] + 0.5) * s; aq, ar = axial(X, Y, w)
        return H[b][(aq == q) & (ar == r)]
    def hAt(x, y): # (the land between the eighths, as js/worldfine.js hL0)
        fx = (x - hd['x0']) / s - 0.5; fy = (y - hd['y0']) / s - 0.5; i = int(math.floor(fx)); j = int(math.floor(fy)); u = fx - i; v = fy - j
        return (H[j, i] * (1 - u) + H[j, i + 1] * u) * (1 - v) + (H[j + 1, i] * (1 - u) + H[j + 1, i + 1] * u) * v
    site = {S['id']: S for S in N['sites']}; P = {p['id']: p for p in N['paths']}
    # ---- THE MOUNTAIN PULLED BACK (11-03 night)
    sv, wr = site.get('silverton'), site.get('warrens'); ft = P.get('feedtrack')
    way = [tuple(h) for h in (ft['hexes'] if ft else [])]
    row = [h for h in way if h != tuple(sv['hex'])] if sv else []
    tops = [(h, int(hexcells(*h).max())) for h in row]
    ok('the road from the town to the Warrens on the area\'s floor: its hexes ' + ', '.join('%d,%d at most %d ft' % (h[0], h[1], t) for h, t in tops) + ' (up the range\'s front to 3,890 before the foot, 11-03)',
       len(row) >= 4 and wr is not None and tuple(wr['hex']) in row and all(t <= 700 for h, t in tops))
    fy, fx = box(118.5, 123.75, 27.45, 28.3); F0 = H[fy, fx]; st = int(max(np.abs(np.diff(F0, axis=0)).max(), np.abs(np.diff(F0, axis=1)).max()))
    ok('the range\'s front behind that road a face, not a cliff: its steepest step %d ft an eighth of a mile (a 3,352 ft cliff before)' % st, st <= 1300)
    behind = [int(hexcells(q, 20).max()) for q in range(68, 73)]
    ok('the range behind it stands: the area\'s hexes 68-72,20 rise to ' + ', '.join(str(v) for v in behind) + ' ft (7,984, 8,456, 7,009, 5,623, 5,759 before)', min(behind) >= 5500 and max(behind) >= 8000)
    rv = [p for p in B['paths'] if p.get('kind') == 'river' and 'Silverton to the sea' in (p.get('name') or '')]
    if rv:
        pts = [p for p in rv[0]['pts'] if isinstance(p, list)]; prof = []
        for a, b in zip(pts, pts[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L / 0.1))
            for k in range(n):
                x, y = a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n
                if 117.6 <= x <= 125: prof.append(hAt(x, y))
        climbs = max([prof[k + 1] - min(prof[:k + 1]) for k in range(len(prof) - 1)] or [0])
        ok('the river from Silverton past the Warrens only falls: %d ft at its head here, %d past the Warrens, its worst rise %d ft (the land between the eighths)' % (prof[0], prof[-1], climbs), prof[0] > prof[-1] and climbs <= 60)
    else: ok('the river from Silverton to the sea: not baked', False)
    ed = [hAt(x, 27.36) for x in (117.50, 117.55, 117.60, 117.64)] # (along his thirteen squares' middle line: tools/hexmap.js seedEdificeTerrace, v-edifice)
    ok('the Edifice\'s terrace kept: ' + ', '.join('%d' % v for v in ed) + ' ft (960)', all(abs(v - 960) <= 15 for v in ed))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
