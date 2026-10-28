"""DEEP16: a sheet's cast row with its spell light drawn by the code -- the art desk's light taken out of the cast frames, and where it sat at the hand kept
in the sheet as `spark`, which js/looks.js LK.spark draws in front of the figure while the row plays (10-28, the second cutter seat).

    python tools/castspark.py lamia_p1           (the sheet in deep16/art/ rewritten; `check` also writes dev/visions/<sheet>-cast.png, before and after at 2x)

Why: Griz's note on the lamia (his ear file 10-28, on the gallery's creatures shelf): "magic spark on spell cast appears behind her, have code draw it when
she casts". The art desk drew the light into each Cast page (ART-20: a violet swirl gathering at her raised hand, flung toward the foe), and the cut gave
frame 4's flung swirl to frame 5, where it stood behind her back in SE, E, NE and their mirrors (and a scrap of it in N's frame 1).

What is the light: the colours the sheet's cast row uses and its idle never does -- for the lamia every violet, the pale pink (accent 0) and the white
(bone 2) -- `LIGHT`. Each cast frame loses those pixels, then any outline pixel left with no figure beside it (the outline the cut drew round the light),
then any small piece left apart from the figure (the swirl's highlights in other colours).
Where it sat, on the art desk's own beats (`BEATS`: its Cast is six frames -- the hand raised, the light gathering in it on 3, flung on 4): on the gather
and the release, the middle of the light's pieces that touch the figure (within 3 px: the hand), not a speck, against the frame's anchor; a release
whose light the cut moved off (the side views: frame 4's swirl went to frame 5) at the hand's tip -- the figure's furthest pixel toward the way it faces at
arm's height; the frame after the release its light fading there. [dx, dy, k] a frame, k the brightness (the gather 0.6, the release 1, the fade 0.35),
0 for none. Run again on a sheet already done, it finds no light and keeps the `spark` it wrote.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'deep16', 'art')
PAL = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json')))['ramps']
hexrgb = lambda h: (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))
LIGHT = {'lamia_p1': [hexrgb(h) for h in PAL['violet']] + [hexrgb(PAL['accent'][0]), hexrgb(PAL['bone'][2])]}
OUTLINE = hexrgb(PAL['outline'][0])
NEAR = 3                                             # px: a piece of light this close to the figure is at the hand
SPECK = 6                                            # px: a piece smaller is a stray, not the light at a hand
FORWARD = [0, -1, -1, -1, 0, 1, 1, 1]                # the side of the screen each facing row looks to (S SW W NW N NE E SE): where a hand's tip is sought
BEATS = {'lamia_p1': {'gather': 2, 'release': 3, 'arm': (-80, -40)}}   # (frame indexes; `arm` the rows, against the anchor, a casting hand stands in)
LOOSE = 30                                           # px: a piece left apart from the figure smaller than this is a leftover of the light


def is_any(rgb, cols):
    m = np.zeros(rgb.shape[:2], bool)
    for c in cols:
        m |= (rgb == np.array(c, rgb.dtype)).all(-1)
    return m


def unspark(name, check=False):
    png, js = os.path.join(ART, name + '.png'), os.path.join(ART, name + '.json')
    a = np.array(Image.open(png).convert('RGBA')); meta = json.load(open(js))
    A = meta['anims']['cast']; fw, fh, ax, ay, n = A.get('fw', meta['fw']), A.get('fh', meta['fh']), A.get('ax', meta['ax']), A.get('ay', meta['ay']), A['frames']
    before = a[A['y']:A['y'] + 8 * fh, :n * fw].copy()
    spark, took = [], 0
    for f in range(8):
        row, bt = [], BEATS[name]
        for i in range(n):
            c = a[A['y'] + f * fh:A['y'] + (f + 1) * fh, i * fw:(i + 1) * fw]
            op = c[..., 3] > 0
            L = op & is_any(c[..., :3], LIGHT[name])
            body = op & ~L & ~is_any(c[..., :3], [OUTLINE])
            lab, nl = ndimage.label(L, structure=np.ones((3, 3)))
            near = ndimage.binary_dilation(body, iterations=NEAR)
            hit = [k for k in range(1, nl + 1) if (near & (lab == k)).any() and (lab == k).sum() >= SPECK]
            at = np.isin(lab, hit) if hit else np.zeros_like(L)
            q = None
            if i in (bt['gather'], bt['release']) and at.any():
                ys, xs = np.nonzero(at); q = [int(round(xs.mean() - ax)), int(round(ys.mean() - ay))]
            elif i == bt['release'] and FORWARD[f]:    # (its light moved off by the cut: the hand's tip)
                band = body[max(0, ay + bt['arm'][0]):ay + bt['arm'][1]]
                ys, xs = np.nonzero(band)
                if len(xs):
                    k = int(np.argmax(xs * FORWARD[f])); q = [int(xs[k] - ax), int(ys[k] + max(0, ay + bt['arm'][0]) - ay)]
            row.append(q)
            if L.any():
                took += int(L.sum())
                c[L, 3] = 0
                for _ in range(2):                    # (the outline the cut drew round the light, left with nothing inside it)
                    op = c[..., 3] > 0; ol = op & is_any(c[..., :3], [OUTLINE])
                    fig = op & ~ol
                    lone = ol & ~ndimage.binary_dilation(fig, structure=np.ones((3, 3)))
                    c[lone, 3] = 0
                lb, nb = ndimage.label(c[..., 3] > 0, structure=np.ones((3, 3)))   # (a leftover of the light in another colour: a small piece apart from the figure)
                if nb > 1:
                    sz = ndimage.sum(np.ones_like(lb), lb, range(1, nb + 1)); keep = 1 + int(np.argmax(sz))
                    for k in range(1, nb + 1):
                        if k != keep and sz[k - 1] < LOOSE:
                            c[lb == k, 3] = 0
        g, r = row[bt['gather']], row[bt['release']]
        out = [0] * n
        if g: out[bt['gather']] = g + [0.6]
        if r or g: out[bt['release']] = (r or g) + [1.0]
        if bt['release'] + 1 < n and (r or g): out[bt['release'] + 1] = (r or g) + [0.35]
        row = out
        spark.append(row)
    if took:
        A['spark'] = spark
        A['sparkEl'] = A.get('sparkEl', 'arcane')
        Image.fromarray(a, 'RGBA').save(png, optimize=True)
        json.dump(meta, open(js, 'w'), indent=1)
    print('  %s: %d px of light taken out of its cast row; spark %s' % (name, took, 'written' if took else ('kept' if 'spark' in A else 'none')))
    if check:
        after = a[A['y']:A['y'] + 8 * fh, :n * fw]
        cv = np.zeros((8 * fh, n * fw * 2 + 8, 4), np.uint8); cv[..., :3] = (16, 24, 56); cv[..., 3] = 255
        for k, blk in enumerate((before, after)):
            al = blk[..., 3:4] / 255.0; sl = cv[:, k * (n * fw + 8):k * (n * fw + 8) + n * fw, :3]
            sl[...] = (blk[..., :3] * al + sl * (1 - al)).astype(np.uint8)
        for f in range(8):                            # the spark's place, a cross, on the after side
            for i, q in enumerate(spark[f]):
                if not q: continue
                x, y = n * fw + 8 + i * fw + ax + q[0], f * fh + ay + q[1]
                cv[max(0, y - 3):y + 4, x, :3] = (255, 255, 255); cv[y, max(0, x - 3):x + 4, :3] = (255, 255, 255)
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv, 'RGBA').resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, name + '-cast.png'))
        print('  dev/visions/%s-cast.png' % name)
    return took


if __name__ == '__main__':
    for nm in [x for x in sys.argv[1:] if x != 'check'] or list(LIGHT):
        unspark(nm, 'check' in sys.argv[1:])
