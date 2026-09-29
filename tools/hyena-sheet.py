"""DEEP16 pipeline 2 (generated art): Griz's generated hyena sheet -> one palette sprite sheet, the hyena.

    python tools/hyena-sheet.py            # deep16/art/hyena_p2.png + .json
    python tools/hyena-sheet.py preview    # dev/shots/hyena-cuts.png: every anim, facings S, E and N side by side, 2x, on grey

Source: deep16/_src/hyena_grok_1.webp (Griz, 2026-09-29, generated; "these properly prompted sheets good for 1 sheet results" --
one sheet is all there is for this creature). A portrait (dropped), a turnaround (front, right, back, left) and rows facing right:
idle 8, walk 8, run 8, bite 8, laugh 6, hurt 6, death 8. The hyenas run with the gnolls (the Snoot's fight: a glory-seeker, two
gnolls, two hyenas); the brief was "the same scale as a gnoll (a four-legged animal, its back about a gnoll's waist high)".
What each row became:
    idle    <- the IDLE row (8)
    walk    <- the WALK row (8)                      (the RUN row is not used)
    attack  <- the BITE row (8)
    hurt    <- the DEATH row (8): the engine plays `hurt` once when a creature goes down, as every generated sheet does
    flinch  <- the HURT row (6): a blow that lands and doesn't drop it, played once
    (the LAUGH row is not used)
Facings: the side rows take the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored, as the gnoll's do); S is the
turnaround's Front still and N its Back still, with the gnoll file's bob and dip tricks (idle breathes, walk bobs, the bite
dips toward -- or, from behind, away from -- the eye); S/N take the side frames for hurt and flinch.
One scale for every side row, set by the idle row's mean height so a hyena stands 36 px to the top of the head (34 px of body
and the outline round it; the gnoll_p2 stands 60): its back comes to a gnoll's waist. The stills get their own scale (they are
drawn larger), set by the front and back stills' mean height, so they stand the same. Each row's frames are cut from one common
window (the row's own top and bottom), so a paw that lifts stays lifted and a row keeps the ground it was drawn on; each is
placed on its torso, so the head, tail and lunge swing without moving the body. A component pass inside each row's band drops
the frame numbers and the row labels by their size.
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
NAME = 'hyena_p2'
A = np.asarray(Image.open(os.path.join(SRC, 'hyena_grok_1.webp')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG = _v[np.argmax(_c)] * 4 + 2                          # the ground: the commonest colour
FW, FH, AX, AY = 96, 80, 48, 72
STAND = 34                                              # px of body from foot to the top of the head, before the outline (36 with it)

# the bands (x0, y0, x1, y1) and how many frames each holds; the rows sit right of the labels (x < 110), above their numbers
BANDS = {'front': ((335, 45, 418, 173), 1), 'back': ((588, 45, 662, 173), 1),
         'idle': ((118, 198, 1135, 276), 8), 'walk': ((118, 288, 1135, 360), 8),
         'attack': ((118, 456, 1135, 523), 8), 'hurt': ((118, 618, 1135, 680), 6),
         'death': ((118, 690, 1135, 752), 8)}


def frames_in(name):
    """the n figures in a row's band, left to right: (cut RGBA array over the row's common window, torso-ready, the figure's own height)."""
    (x0, y0, x1, y1), n = BANDS[name]
    c = A[y0:y1, x0:x1]
    m0 = np.abs(c - BG).sum(-1) > 45                                       # the figure's pixels
    m = np.pad(m0, 6)
    m = ndimage.binary_closing(m, iterations=2)[6:-6, 6:-6]                # (to group the pieces: a tail, a paw, a gap)
    lab, k = ndimage.label(m)
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        if area < 1500:                                                    # a number, a label's word, a speck
            continue
        comps.append({'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop, 'area': area})
    comps.sort(key=lambda d: d['x0'])
    groups = []
    for d in comps:                                                        # pieces that share columns are one figure
        if groups and d['x0'] <= groups[-1]['x1'] + 6:
            g = groups[-1]
            g['ids'].append(d['id']); g['x1'] = max(g['x1'], d['x1']); g['y0'] = min(g['y0'], d['y0']); g['y1'] = max(g['y1'], d['y1']); g['area'] += d['area']
        else:
            groups.append({'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'y0': d['y0'], 'y1': d['y1'], 'area': d['area']})
    groups = sorted(sorted(groups, key=lambda g: -g['area'])[:n], key=lambda g: g['x0'])
    assert len(groups) == n, (name, len(groups))
    ty, by = min(g['y0'] for g in groups), max(g['y1'] for g in groups)      # the row's own window, top to ground
    out = []
    for g in groups:
        mm = np.isin(lab, g['ids']) & m0
        mm = ndimage.binary_fill_holes(mm)
        cc = c[ty:by, g['x0']:g['x1']]
        am = mm[ty:by, g['x0']:g['x1']]
        img = Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')
        out.append({'img': img, 'h': g['y1'] - g['y0'], 'top': g['y0'] - ty})
    return out


def fit(img, scale):
    """one scale: premultiplied box down, a 1-px margin for the outline, snapped to the palette."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a tail and a raised head are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 75 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


CLIPPED = []


def place(a, x_ref, tag=''):
    """the cut onto the frame: its torso on AX, the cut's bottom (the row's ground, outline and all) on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - (a.shape[0] - 1)
    h, w = a.shape[:2]
    if ox < 0 or oy < 0 or ox + w > FW or oy + h > FH:
        rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
        if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
            CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def breathe(fr):
    """the chest rises a pixel (the legs stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] - 1:mid] = fr[rows[0]:mid + 1]
    return o


def mirror(seq):
    """west of the drawn east: a flip, then a pixel back so the torso stays on the anchor column."""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build():
    rows = {k: frames_in(k) for k in BANDS}
    stand = np.mean([d['h'] for d in rows['idle']]) / STAND                 # the side rows, by the idle row's height
    stills = np.mean([rows['front'][0]['h'], rows['back'][0]['h']]) / STAND    # the turnaround's own scale
    print('  side scale %.3f (idle %.1f px of source), still scale %.3f' % (stand, stand * STAND, stills))

    def side(k):
        return [place(a, torso_x(a), '%s%d' % (k, i)) for i, a in enumerate(fit(d['img'], stand) for d in rows[k])]
    idle_r, walk_r, atk_r, hurt_r, flinch_r = side('idle'), side('walk'), side('attack'), side('death'), side('hurt')
    fa, ba = fit(rows['front'][0]['img'], stills), fit(rows['back'][0]['img'], stills)
    fS, fN = place(fa, torso_x(fa), 'front'), place(ba, torso_x(ba), 'back')
    idle_l, walk_l, atk_l, hurt_l, flinch_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(hurt_r), mirror(flinch_r)
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    dip = [0, 0, 1, 2, 3, 2, 1, 0]

    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'flinch': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        if f == 0:
            frames['idle'].append([fS] * 4 + [breathe(fS)] * 4)
            frames['walk'].append([shift(fS, 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([shift(fS, 0, d) for d in dip])
            frames['hurt'].append(hurt_r); frames['flinch'].append(flinch_r)
        elif f == 4:
            frames['idle'].append([fN] * 4 + [breathe(fN)] * 4)
            frames['walk'].append([shift(fN, 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([shift(fN, 0, -d) for d in dip])
            frames['hurt'].append(hurt_l); frames['flinch'].append(flinch_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r)
            frames['hurt'].append(hurt_r); frames['flinch'].append(flinch_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l)
            frames['hurt'].append(hurt_l); frames['flinch'].append(flinch_l)
    for t in CLIPPED:
        print('  CLIPPED', t)
    return frames


def write(frames):
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(meta_p))
    for k, v in {'idle': 5, 'walk': 10, 'attack': 12, 'hurt': 8, 'flinch': 12}.items():
        meta['anims'][k]['fps'] = v
    meta['source'] = 'generated by Griz (2026-09-29, one sheet), cut and snapped by tools/hyena-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


def preview(frames):
    """every anim's frames for facings S, E and N side by side, 2x, on a mid-grey ground (one row of cells per anim)."""
    allf = [fr for a in frames.values() for f in (0, 6, 4) for fr in a[f]]
    cols = np.where(np.any([fr[..., 3].any(axis=0) for fr in allf], axis=0))[0]
    rws = np.where(np.any([fr[..., 3].any(axis=1) for fr in allf], axis=0))[0]
    cx0, cx1 = max(0, cols[0] - 2), min(FW, cols[-1] + 3)
    cy0, cy1 = max(0, rws[0] - 2), min(FH, AY + 4)
    cw, ch = cx1 - cx0, cy1 - cy0
    print('  preview window x %d-%d y %d-%d (content spans x %d-%d, y %d-%d)' % (cx0, cx1, cy0, cy1, cols[0], cols[-1], rws[0], rws[-1]))
    S, GAP = 2, 8
    nmax = max(len(a[0]) for a in frames.values())
    W = 3 * nmax * cw * S + 2 * GAP * S + 2 * GAP
    H = len(frames) * (ch * S + GAP)
    img = np.zeros((H, W, 3), dtype=np.uint8); img[:] = (112, 112, 112)
    for r, (anim, a) in enumerate(frames.items()):
        x = GAP
        for f in (0, 6, 4):
            for i, fr in enumerate(a[f]):
                cell = fr[cy0:cy1, cx0:cx1]
                big = np.repeat(np.repeat(cell, S, 0), S, 1)
                y = r * (ch * S + GAP)
                sub = img[y:y + ch * S, x + i * cw * S:x + (i + 1) * cw * S]
                al = big[..., 3:4] > 0
                sub[:] = np.where(al, big[..., :3], sub)
                img[y, x + i * cw * S:x + (i + 1) * cw * S] = (90, 90, 90)              # a cell's top edge
                img[y + (AY - cy0 + 1) * S, x + i * cw * S:x + (i + 1) * cw * S] = (160, 60, 60)   # the ground line, under the anchor row
            x += nmax * cw * S + GAP * S
    out = os.path.join(ROOT, 'dev', 'shots', 'hyena-cuts.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    Image.fromarray(img, 'RGB').save(out)
    print('  wrote', out, img.shape[1], 'x', img.shape[0])


if __name__ == '__main__':
    fr = build()
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview(fr)
    else:
        write(fr)
