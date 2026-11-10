"""The barn and the wagon, the angle pass, by their pixels (11-10, the cutter of the art desk's HALFWAY-INN-BARN-WAGON-ANGLE-REVISION; the benches fetch no images,
so this reads deep16/art/innprops_p2.png): each stall laid wall by wall stands with its feet on its 2 x 2's corners -- the front post's foot at the diamond's front
corner, the left and right posts' at its side corners -- the north row's (barn_stallN) open on its front-left edge, onto the aisle, the south row's (barn_stallS)
walled there with its head wall and open on its back edge; the wagon (yard_wagonT) inside its 4 x 2's span, and its rim (yard_wagonRim) the wagon's own pixels over
the tail square alone. mode=barnwagon1110 is the floor's side. Quick gate (dev/check.py QUICK_SCRIPTS).   python dev/barnwagon-probe.py"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'deep16', 'art')
fails = []


def ok(what, v):
    print(('ok   ' if v else 'FAIL ') + what)
    if not v:
        fails.append(what)


def main():
    js = json.load(open(os.path.join(ART, 'innprops_p2.json'), encoding='utf-8'))
    px = np.asarray(Image.open(os.path.join(ART, 'innprops_p2.png')).convert('RGBA'))
    tiles = js['tiles']
    need = ['barn_stallN', 'barn_stallS', 'yard_wagonT', 'yard_wagonRim']
    ok('innprops_p2 holds the angle pass: ' + ', '.join('%s %s' % (n, 'yes' if n in tiles else 'NONE') for n in need), all(n in tiles for n in need))
    if not all(n in tiles for n in need):
        print('RED'); return 1

    def piece(n):
        x, y, w, h, ax, ay = map(int, tiles[n].split(' ')[0].split(','))
        return px[y:y + h, x:x + w], ax, ay

    def low(al, x0, x1):                                  # the lowest opaque row over columns x0..x1
        sub = al[:, max(0, x0):max(0, x1)]
        ys = np.where(sub.any(1))[0]
        return int(ys.max()) if len(ys) else None

    for n, opens in (('barn_stallN', 'front'), ('barn_stallS', 'back')):
        g, ax, ay = piece(n); al = g[..., 3] > 0
        F, L, R = low(al, ax - 4, ax + 4), low(al, ax - 64, ax - 54), low(al, ax + 54, ax + 64)
        xs = np.where(al.any(0))[0]
        feet = F is not None and L is not None and R is not None and abs(F - (ay + 64)) <= 3 and abs(L - (ay + 32)) <= 5 and abs(R - (ay + 32)) <= 5
        ok('%s: its feet on the diamond (front %s of %d, left %s and right %s of %d), across %d..%d of %d..%d'
           % (n, F, ay + 64, L, R, ay + 32, xs.min() - ax, xs.max() - ax, -64, 64), feet and xs.min() - ax >= -74 and xs.max() - ax <= 74)   # (a post straddles its corner: half of it past the diamond)
        # the front-left edge's middle (-32, 48): between it and the far left wall's foot (-32, 16) the floor shows if that edge is open; the back edge's middle (32, 16):
        # over it (above the near side wall's top there, 44 px over its ground line at 48), nothing if that edge is open
        fl = al[ay + 24:ay + 44, ax - 34:ax - 30].mean()
        bk = al[max(0, ay - 24):ay + 2, ax + 30:ax + 34].mean()
        want = (fl < 0.2 and bk > 0.5) if opens == 'front' else (fl > 0.8 and bk < 0.2)
        ok('%s opens on its %s edge (front-left edge walled %.2f, over the back edge %.2f)' % (n, opens, fl, bk), want)

    gw, axw, ayw = piece('yard_wagonT'); gr, axr, ayr = piece('yard_wagonRim')
    aw = gw[..., 3] > 0; xs = np.where(aw.any(0))[0]
    ok('yard_wagonT inside its 4 x 2\'s span: across %d..%d of %d..%d' % (xs.min() - axw, xs.max() - axw, -64, 128), xs.min() - axw >= -64 and xs.max() - axw <= 128)
    ar = gr[..., 3] > 0; ys_, xs_ = np.where(ar)
    wy, wx = ys_ - ayr + ayw, xs_ - axr + axw                 # (each rim pixel where it falls on the wagon, anchor on anchor)
    inside = (wy >= 0) & (wy < gw.shape[0]) & (wx >= 0) & (wx < gw.shape[1])
    same = inside.all() and (gw[wy, wx] == gr[ys_, xs_]).all()
    ok('yard_wagonRim the wagon\'s own %d pixels (%s), over the tail square alone (across %d..%d; the tail\'s columns from 32)'
       % (len(ys_), 'the same' if same else 'NOT the same', xs_.min() - axr, xs_.max() - axr), same and xs_.min() - axr >= 32 and len(ys_) > 200)
    print('RED' if fails else 'GREEN')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
