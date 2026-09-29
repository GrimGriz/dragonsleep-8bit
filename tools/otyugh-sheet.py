"""DEEP16 pipeline 2 (generated art): Griz's generated otyugh sheet -> the otyugh's palette sprite sheet (the landlord of the Warrens).

    python tools/otyugh-sheet.py            builds deep16/art/otyugh_p2.png/.json
    python tools/otyugh-sheet.py preview    writes dev/shots/otyugh-cuts.png (every anim, facings S, E and N, 2x on grey) and stops

Source: deep16/_src/otyugh_grok_1.webp (Griz, 2026-09-29, generated; "These properly prompted sheets good for 1 sheet results": one sheet is
all there is for this creature). A big portrait (unused), a turnaround (Front, Right, Back, Left), then rows all facing right, on a flat
navy ground: Idle 8 (half sunk in its pool, the drawn ripples kept), Rise 6, Walk 8, Attack 8 (the tentacle slam), Bite 6 (unused: the
engine has one attack anim per sheet), Hurt 6, Death (labelled 8, nine figures drawn, its numbers misprinted: cut left to right).
What each row became:
  idle    the Idle row, all eight facings (the west side mirrored; S as drawn, N mirrored); the pool and its ripples are part of the
          figure, and the waterline (where the body meets the water) is placed on the foot (AY): the ripples spread below it
  walk    the Walk row; S and N from the turnaround's Front and Back stills with a one-pixel bob (the gnoll pattern)
  attack  the Attack row; S and N the stills with a dip toward and away from the viewer (the gnoll pattern)
  hurt    the Death row (the engine plays `hurt` once when a creature goes down: the convention every generated sheet follows)
  flinch  the Hurt row less its last frame (a collapse into a heap, not a recoil): a blow that lands and does not drop it, played
          once; S and N reuse the side frames
  reveal  the Rise row, all facings (the landlord rising from its pool: for the fight's intro), the same pool and scale as the idle
The walk, attack, hurt and flinch rows are one group with one scale (the Walk row's figure stands 66 px: a Large creature, the chuul's
63), and the idle and rise rows are drawn at that same scale on the source, so the half-sunk body matches the risen one. The frames are
found by a component pass inside each row's band (the numbers and labels dropped by their size and place); each is placed on its
torso (the pool for the idle and rise rows) and on the row's own baseline, so a slam's splash does not lift the feet.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')
NAME = 'otyugh_p2'
FW, FH, AX, AY = 180, 120, 90, 108
HEIGHT = 66                 # the Walk row's figure, in px (the chuul_p2, also Large: 63)
WATER = 12                  # source px from the mask's bottom up to the waterline, in the idle and rise rows (the ripples hang below it)
PAD = 3                     # a transparent margin round every cut, so the outline is drawn on all four sides

A = np.asarray(Image.open(os.path.join(SRC, 'otyugh_grok_1.webp')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG = _v[np.argmax(_c)] * 4 + 2                            # the ground: the commonest colour

# the bands (x0, y0, x1, y1) and how many frames each holds. Each band stops above its row's numbers and starts below the row above
BANDS = {'front': ((330, 40, 600, 229), 1), 'back': ((820, 40, 1030, 229), 1),
         'idle': ((0, 318, 1312, 392), 8), 'rise': ((0, 428, 1312, 525), 6), 'walk': ((0, 555, 1312, 660), 8),
         'attack': ((0, 712, 1312, 806), 8), 'hurt': ((0, 970, 1312, 1057), 6), 'death': ((0, 1092, 1312, 1173), 9)}
# the row title's letters hang lower than the first figure's top there (the Hurt row's): blanked before the pass
BLANK = {'hurt': [(0, 970, 125, 983)]}


def frames_in(band, n, maxw=190, blank=()):
    """the n figures in a row's band, left to right: dicts of the cut RGBA image (with its PAD margin), `oy` (the sheet's y of the image's
    top row) and `bottom` (the sheet's y of the figure's lowest row)."""
    x0, y0, x1, y1 = band
    c = A[y0:y1, x0:x1]
    m = np.abs(c - BG).sum(-1) > 45
    for bx0, by0, bx1, by1 in blank:
        m[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0] = False
    m = ndimage.binary_closing(m, iterations=2)
    lab, k = ndimage.label(m)
    big, small = [], []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((lab[sl] == i + 1).sum())
        d = {'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop, 'area': area}
        if w > maxw:
            continue
        if area >= 1500 and h >= 30:
            big.append(d)
        elif area >= 20:
            small.append(d)
    # pieces that share columns are one figure (a tentacle held clear of the body)
    big.sort(key=lambda d: d['x0'])
    groups = []
    for d in big:
        if groups and d['x0'] <= groups[-1]['x1'] + 6:
            g = groups[-1]
            g['ids'].append(d['id']); g['x1'] = max(g['x1'], d['x1']); g['y0'] = min(g['y0'], d['y0']); g['y1'] = max(g['y1'], d['y1']); g['area'] += d['area']
        else:
            groups.append({'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'y0': d['y0'], 'y1': d['y1'], 'area': d['area']})
    groups = sorted(sorted(groups, key=lambda g: -g['area'])[:n], key=lambda g: g['x0'])
    assert len(groups) == n, (band, len(groups))
    out = []
    for g in groups:
        ids = list(g['ids'])
        for s in small:                      # a detached bit inside the figure's box (an eye cluster off its stalk); a label sits outside it
            if s['x0'] < g['x1'] + 3 and s['x1'] > g['x0'] - 3 and s['y0'] < g['y1'] + 3 and s['y1'] > g['y0'] - 3:
                ids.append(s['id'])
        mm = ndimage.binary_fill_holes(np.isin(lab, ids))
        ys, xs = np.where(mm)
        cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        am = mm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        img = np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)])
        img = np.pad(img, ((PAD, PAD), (PAD, PAD), (0, 0)))
        out.append({'img': Image.fromarray(img, 'RGBA'), 'oy': y0 + ys.min() - PAD, 'bottom': y0 + ys.max(), 'h': int(ys.max() - ys.min() + 1)})
    return out


def fit(cut, scale):
    """one cut to 1x: boxed down by `scale`, palette-snapped and outlined. Returns the frame array and its scale on the y axis."""
    img = cut['img']
    w, h = img.size
    nw, nh = max(1, round(w / scale)), max(1, round(h / scale))
    return pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False), nh / h


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a raised tentacle is thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 65 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def pool_x(a):
    """the middle of the pool: the median opaque column over the lowest rows (the water alone, wider than the body)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    ys, xs = np.where(a[rows[-1] - 5:rows[-1] + 1, :, 3] > 0)
    return float(np.median(xs))


def place(a, x_ref, base_row, dy=0):
    """a frame array on the sheet's frame: the column x_ref on AX, the row base_row on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - int(base_row) + dy
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def side(ims, scale, anchor, base):
    """a row of side-view cuts to frames: `base` the sheet's y of the row's baseline, or a function of a cut (the pool's own)."""
    out = []
    for cut in ims:
        a, fy = fit(cut, scale)
        b = base(cut) if callable(base) else base
        out.append(place(a, anchor(a), round((b - cut['oy']) * fy)))
    return out


def build_frames():
    rows = {k: frames_in(*v, maxw=260 if k in ('front', 'back') else 190, blank=BLANK.get(k, ())) for k, v in BANDS.items()}
    walk_h = np.mean([c['h'] for c in rows['walk']])
    scale = walk_h / HEIGHT                               # the Walk row's figure stands HEIGHT px; every side row on the source shares it
    med = lambda ims: float(np.median([c['bottom'] for c in ims]))
    idle_r = side(rows['idle'], scale, pool_x, lambda c: c['bottom'] - WATER)
    rise_r = side(rows['rise'], scale, pool_x, lambda c: c['bottom'] - WATER)
    walk_r = side(rows['walk'], scale, torso_x, med(rows['walk']))
    atk_r = side(rows['attack'], scale, torso_x, med(rows['attack']))
    flinch_r = side(rows['hurt'][:5], scale, torso_x, med(rows['hurt'][:5]))       # the sixth is the collapse
    death_r = side(rows['death'], scale, torso_x, med(rows['death']))
    stills = {}
    for k in ('front', 'back'):                           # the turnaround's stills, each to the same standing height
        a, fy = fit(rows[k][0], rows[k][0]['h'] / HEIGHT)
        stills[k] = place(a, torso_x(a), round((rows[k][0]['bottom'] - rows[k][0]['oy']) * fy))
    fS, fN = stills['front'], stills['back']
    # the mirror is exact on the anchor: the frame is even wide, so a flip lands AX on AX - 1, and the roll puts it back
    mirror = lambda seq: [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]
    idle_l, rise_l, walk_l, atk_l, flinch_l, death_l = (mirror(s) for s in (idle_r, rise_r, walk_r, atk_r, flinch_r, death_r))
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)

    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'flinch': [], 'reveal': []}
    for f in range(8):                                    # facings S, SW, W, NW, N, NE, E, SE
        if f == 0:
            frames['idle'].append(idle_r)
            frames['walk'].append([shift(fS, 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([fS, fS, shift(fS, 0, 1), shift(fS, 0, 3), shift(fS, 0, 4), shift(fS, 0, 3), shift(fS, 0, 1), fS])
            frames['hurt'].append(death_r); frames['flinch'].append(flinch_r); frames['reveal'].append(rise_r)
        elif f == 4:
            frames['idle'].append(idle_l)
            frames['walk'].append([shift(fN, 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([fN, fN, shift(fN, 0, -1), shift(fN, 0, -3), shift(fN, 0, -4), shift(fN, 0, -3), shift(fN, 0, -1), fN])
            frames['hurt'].append(death_l); frames['flinch'].append(flinch_l); frames['reveal'].append(rise_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r)
            frames['hurt'].append(death_r); frames['flinch'].append(flinch_r); frames['reveal'].append(rise_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l)
            frames['hurt'].append(death_l); frames['flinch'].append(flinch_l); frames['reveal'].append(rise_l)
    return frames, scale


def preview(frames):
    """every anim's frames for facings S, E and N, side by side at 2x on mid-grey; the foot's row (AY) and column (AX) ticked."""
    from PIL import ImageDraw
    every = [fr for anim in frames for f in (0, 4, 6) for fr in frames[anim][f]]
    al = np.max([fr[..., 3] for fr in every], axis=0) > 0
    ys, xs = np.where(al)
    cx0, cx1, cy0, cy1 = max(0, xs.min() - 3), min(FW, xs.max() + 4), max(0, ys.min() - 3), FH
    cw, ch = (cx1 - cx0) * 2, (cy1 - cy0) * 2
    gut = 78
    nmax = max(len(frames[a][0]) for a in frames)
    im = Image.new('RGBA', (gut + nmax * cw, len(frames) * 3 * ch), (110, 110, 110, 255))
    d = ImageDraw.Draw(im)
    r = 0
    for anim in frames:
        for f, nm in ((0, 'S'), (6, 'E'), (4, 'N')):
            y = r * ch
            d.text((4, y + 4), '%s %s' % (anim, nm), fill=(255, 255, 0, 255))
            d.text((4, y + 16), '%d fr' % len(frames[anim][f]), fill=(220, 220, 220, 255))
            for i, fr in enumerate(frames[anim][f]):
                x = gut + i * cw
                cell = Image.fromarray(fr[cy0:cy1, cx0:cx1], 'RGBA').resize((cw, ch), Image.NEAREST)
                im.alpha_composite(cell, (x, y))
                d.line((x, y + (AY - cy0) * 2 + 1, x + cw - 1, y + (AY - cy0) * 2 + 1), fill=(200, 60, 60, 255))
                d.line((x + (AX - cx0) * 2, y + ch - 8, x + (AX - cx0) * 2, y + ch - 1), fill=(60, 200, 60, 255))
                d.rectangle((x, y, x + cw - 1, y + ch - 1), outline=(80, 80, 80, 255))
            r += 1
    os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
    im.save(os.path.join(ROOT, 'dev', 'shots', 'otyugh-cuts.png'))


def build():
    frames, scale = build_frames()
    # the label and HP bar ride above the figure: the tallest it stands, risen (the walk and the slam) or sunk (the idle)
    top = pix.top_of(frames['idle'][0] + frames['idle'][6] + frames['walk'][0] + frames['walk'][6] + frames['attack'][0] + frames['attack'][6], AY)
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, top)
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for a, fps in (('idle', 5), ('walk', 8), ('attack', 10), ('hurt', 8), ('flinch', 12), ('reveal', 6)):
        meta['anims'][a]['fps'] = fps
    meta['source'] = 'generated by Griz (2026-09-29, one sheet), cut and snapped by tools/otyugh-sheet.py'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  scale %.3f (walk row %.1f px source -> %d px)' % (scale, scale * HEIGHT, HEIGHT))


if __name__ == '__main__':
    if 'preview' in sys.argv:
        fr, sc = build_frames()
        preview(fr)
        print('preview written (scale %.3f)' % sc)
        sys.exit(0)
    build()
