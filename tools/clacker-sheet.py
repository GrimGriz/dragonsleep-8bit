"""DEEP16 pipeline 2 (generated art): Griz's clacker sheet -> the clacker's palette sprite sheet.

    python tools/clacker-sheet.py            # deep16/art/clacker_p1.png + .json
    python tools/clacker-sheet.py preview    # dev/shots/clacker-cuts.png: every anim, facings S, E and N side by side, 2x, on grey

Source: deep16/_src/clacker_grok_1.png (Griz, 2026-10-01, generated from the art list's Q2 head: "THE CLACKER -- Hook Horror -
Deep Caves"; his copy is dev/visions/clacker.png). The clackers are the realm's hook horrors, the colony crowning the crook (the
landlord's fourth picture). Rows, all facing right: idle 8, walk 8, hook 8, clack 6 (frames 2-5 turned to the viewer, the hooks
struck together over the head), climb 6 (not used: the grid has no walls to climb), hurt 6, death 8; and a turnaround of four
stills. What each became:
    idle    <- the IDLE row (8)
    walk    <- the WALK row (8)
    attack  <- the HOOK row (8)
    clack   <- the CLACK row (6): played at the start of each of its turns, a clack on the strikes (deep16/js/ai.js)
    hurt    <- the DEATH row (8): the engine plays `hurt` once when a creature goes down, as every generated sheet does
    flinch  <- the HURT row (6)
Facings: the rows take the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored); S is the Front still (breathing; the walk
a bob of it; the attack a dip), N the Back still the same way, and S/N take the side frames for hurt and flinch, the clack as drawn
(it turns to the viewer anyway). One scale for every row, set by the idle row's height so the clacker stands STAND px to the top of
its back, hooks over that -- Large and hunched, half again a man of ~50; the turnaround is drawn larger on the page and gets its own
scale, by its Right still against the idle's first frame (the same side pose). Each row is cut over one common window (its own top to
its ground), so a lifted foot stays lifted; each frame is placed on its torso. Small pieces apart from a figure (a hook tip, the
clack's sparks) go to the figure whose columns they fall in.
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
NAME = 'clacker_p1'
A = np.asarray(Image.open(os.path.join(SRC, 'clacker_grok_1.png')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG = _v[np.argmax(_c)] * 4 + 2                          # the ground: the commonest colour (the sheet's navy)
FW, FH, AX, AY = 160, 112, 80, 102
STAND = 72                                              # px of clacker from its feet to the top of its back, before the outline

# the bands (x0, y0, x1, y1): right of the row labels, under the row above's frame numbers, above its own; how many figures each holds
BANDS = {'idle': ((190, 214, 1300, 312), 8), 'walk': ((190, 328, 1300, 420), 8), 'hook': ((190, 446, 1300, 541), 8),
         'clack': ((190, 562, 1100, 664), 6), 'hurt': ((190, 808, 1100, 888), 6), 'death': ((190, 905, 1420, 986), 8),
         'front': ((690, 10, 800, 180), 1), 'right': ((865, 10, 995, 180), 1), 'back': ((1060, 10, 1180, 180), 1)}


def frames_in(name):
    """the n figures in a row's band, left to right: {'img': RGBA cut over the row's common window, 'h': its own height}."""
    (x0, y0, x1, y1), n = BANDS[name]
    c = A[y0:y1, x0:x1]
    m0 = np.abs(c - BG).sum(-1) > 45                                       # the figure's pixels
    m = ndimage.binary_closing(np.pad(m0, 6), iterations=2)[6:-6, 6:-6]    # (to group a figure's pieces)
    lab, k = ndimage.label(m)
    big, small = [], []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        d = {'ids': [i + 1], 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop, 'area': area}
        (big if area >= 1200 else small if area >= 12 else []).append(d)
    big.sort(key=lambda d: d['x0'])
    assert len(big) == n, (name, len(big), [(b['x0'], b['area']) for b in big])
    for s in small:                                                        # a hook tip or a spark apart: the figure over it
        cx = (s['x0'] + s['x1']) / 2
        g = min(big, key=lambda b: 0 if b['x0'] <= cx < b['x1'] else min(abs(cx - b['x0']), abs(cx - b['x1'])))
        g['ids'] += s['ids']; g['y0'] = min(g['y0'], s['y0']); g['y1'] = max(g['y1'], s['y1'])
        g['x0'] = min(g['x0'], s['x0']); g['x1'] = max(g['x1'], s['x1'])
    ty, by = min(g['y0'] for g in big), max(g['y1'] for g in big)       # the row's own window, top to ground
    out = []
    for g in big:
        mm = np.isin(lab, g['ids']) & m0
        # only the small holes filled (specks inside the hide): a gap between a hook and an arm is the sheet's navy, and stays open
        hl, nh = ndimage.label(ndimage.binary_fill_holes(mm) & ~mm)
        if nh:
            sizes = ndimage.sum(np.ones_like(hl), hl, range(1, nh + 1))
            mm = mm | np.isin(hl, [i + 1 for i, s in enumerate(sizes) if s < 30])
        cc = c[ty:by, g['x0']:g['x1']]
        am = mm[ty:by, g['x0']:g['x1']]
        img = Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')
        out.append({'img': img, 'h': g['y1'] - g['y0'], 'w': g['x1'] - g['x0']})
    return out


def fit(img, scale):
    """one scale: premultiplied box down, a 1-px margin for the outline, snapped to the palette."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (the hooks above and the beak are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 75 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


CLIPPED = []


def place(a, x_ref, tag=''):
    """the cut onto the frame: its torso on AX, the cut's bottom (the row's ground, outline and all) on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - (a.shape[0] - 1)
    h, w = a.shape[:2]
    rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
    if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
        CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def breathe(fr):
    """the back rises a pixel (the legs stay put)."""
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
    ih = np.mean([d['h'] for d in rows['idle']])
    side_s = ih / STAND                                                    # every row at the idle's scale: the page draws them alike
    turn_s = side_s * rows['right'][0]['h'] / rows['idle'][0]['h']         # the turnaround, drawn larger: the same side pose, matched
    print('  scale %.2f (rows), %.2f (turnaround)' % (side_s, turn_s))

    def cut(k, s):
        return [place(a, torso_x(a), '%s%d' % (k, i)) for i, a in enumerate(fit(d['img'], s) for d in rows[k])]
    idle_r, walk_r, atk_r, clack_r, flinch_r, hurt_r = (cut(k, side_s) for k in ('idle', 'walk', 'hook', 'clack', 'hurt', 'death'))
    fS, fN = cut('front', turn_s)[0], cut('back', turn_s)[0]
    idle_l, walk_l, atk_l, clack_l, flinch_l, hurt_l = (mirror(x) for x in (idle_r, walk_r, atk_r, clack_r, flinch_r, hurt_r))
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    dip = [0, 0, 1, 2, 3, 3, 2, 1]                                        # (the hook's eight frames, from the front: a lunge at the eye)
    bob = [0, -1, -1, 0, 0, -1, -1, 0]                                    # (the walk toward and away: a stride's rise)

    frames = {'idle': [], 'walk': [], 'attack': [], 'clack': [], 'hurt': [], 'flinch': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        if f in (0, 4):
            st = fS if f == 0 else fN
            frames['idle'].append([st] * 4 + [breathe(st)] * 4); frames['walk'].append([shift(st, 0, b) for b in bob])
            frames['attack'].append([shift(st, 0, d if f == 0 else -d) for d in dip]); frames['clack'].append(clack_r)
            frames['hurt'].append(hurt_r if f == 0 else hurt_l); frames['flinch'].append(flinch_r if f == 0 else flinch_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r); frames['clack'].append(clack_r)
            frames['hurt'].append(hurt_r); frames['flinch'].append(flinch_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l); frames['clack'].append(clack_l)
            frames['hurt'].append(hurt_l); frames['flinch'].append(flinch_l)
    for t in CLIPPED:
        print('  CLIPPED', t)
    return frames


def write(frames):
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(meta_p))
    for k, v in {'idle': 6, 'walk': 9, 'attack': 12, 'clack': 10, 'hurt': 8, 'flinch': 12}.items():
        meta['anims'][k]['fps'] = v
    meta['source'] = 'generated by Griz (2026-10-01), cut and snapped by tools/clacker-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    # the sheet's frames are larger than most (the hooks), so it is kept as an indexed PNG: the colours are already the palette's,
    # so every pixel survives exactly (index 0 the clear)
    png = os.path.join(ROOT, 'deep16', 'art', NAME + '.png')
    a = np.asarray(Image.open(png).convert('RGBA'))
    on = a[..., 3] > 0
    cols, inv = np.unique(a[on][:, :3], axis=0, return_inverse=True)
    if len(cols) <= 255:
        idx = np.zeros(a.shape[:2], dtype=np.uint8); idx[on] = inv.ravel() + 1
        im = Image.fromarray(idx, 'P'); im.putpalette([0, 0, 0] + cols.astype(np.uint8).ravel().tolist())
        im.save(png, optimize=True, transparency=0)
        print('  indexed: %d colours, %d bytes' % (len(cols), os.path.getsize(png)))


def preview(frames):
    """every anim's frames for facings S, E and N side by side, 2x, on a mid-grey ground (one row of cells per anim)."""
    allf = [fr for a in frames.values() for f in (0, 6, 4) for fr in a[f]]
    cols = np.where(np.any([fr[..., 3].any(axis=0) for fr in allf], axis=0))[0]
    rws = np.where(np.any([fr[..., 3].any(axis=1) for fr in allf], axis=0))[0]
    cx0, cx1 = max(0, cols[0] - 2), min(FW, cols[-1] + 3)
    cy0, cy1 = max(0, rws[0] - 2), min(FH, AY + 4)
    cw, ch = cx1 - cx0, cy1 - cy0
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
                sub[:] = np.where(big[..., 3:4] > 0, big[..., :3], sub)
                img[y + (AY - cy0 + 1) * S, x + i * cw * S:x + (i + 1) * cw * S] = (160, 60, 60)   # the ground line
            x += nmax * cw * S + GAP * S
    out = os.path.join(ROOT, 'dev', 'shots', 'clacker-cuts.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    Image.fromarray(img, 'RGB').save(out)
    print('  wrote', out, img.shape[1], 'x', img.shape[0])


if __name__ == '__main__':
    fr = build()
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview(fr)
    else:
        write(fr)
