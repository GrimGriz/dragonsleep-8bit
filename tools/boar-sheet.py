"""DEEP16 pipeline 2 (generated art): Griz's wild boar sheet -> the giant boar's palette sprite sheet.

    python tools/boar-sheet.py            # deep16/art/giantboar_p2.png + .json
    python tools/boar-sheet.py preview    # dev/shots/boar-cuts.png: every anim, facings S, E and N side by side, 2x, on grey

Source: deep16/_src/boar_grok_1.webp (Griz, 2026-09-30, generated: "WILD BOAR - 16 BIT ANIMATION SHEET (1/2) - MOVEMENT & CORE").
Why: the ladder's giant boar was the Quaternius bull turned round (tools/deep16-figures.json giantboar, yaw 180), and in his
playtest it "charged us bum-first". This replaces it (`giantboar_p1`, kept). Rows, all facing right but the walks toward and away:
idle 2, walk 4, walk left 5 (not used), walk front 5, walk back 5, run 5 (not used: its figures touch), charge/gore 7, bite 4 (not
used: one attack anim a sheet), hit 3, death 7, sprint 7, turn 10 (not used). What each became:
    idle    <- the IDLE row (2), each held four frames
    walk    <- the WALK (RIGHT) row (4), twice
    attack  <- the ATTACK (CHARGE / GORE) row (7)
    hurt    <- the DEATH row (7): the engine plays `hurt` once when a creature goes down, as every generated sheet does
    flinch  <- the HIT / RECOIL row (3)
    run     <- the SPRINT / FULL RUN row (7): the grid draws it in place of the walk once a creature that charges has come
               20 ft this turn (deep16/js/ui.js unitObj; js/traits.js, the Charge)
Facings: the side rows take the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored); S is the WALK (FRONT) row (its first
figure the still, breathing; its first four the walk and the run) and N the WALK (BACK) row the same way; S/N take the side
frames for the attack's dip trick, hurt and flinch, as the hyena's do. One scale for every side row, set by the idle row's height
so the boar stands STAND px to the top of its bristles -- a Large boar "the size of a pony" (data/fights.js, the south road)
beside a man of ~50; the walks toward and away are drawn larger on the page and get their own scale to stand the same. Each row
is cut over one common window (its own top to its ground), so a hoof that lifts stays lifted; each frame is placed on its torso.
Small pieces apart from a figure (a lifted hoof, a tail, a tusk) go to the figure whose columns they fall in.
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
NAME = 'giantboar_p2'
A = np.asarray(Image.open(os.path.join(SRC, 'boar_grok_1.webp')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG = _v[np.argmax(_c)] * 4 + 2                          # the ground: the commonest colour
FW, FH, AX, AY = 160, 100, 80, 90
STAND = 46                                              # px of boar from hoof to the top of the bristles, before the outline

# the bands (x0, y0, x1, y1) inside each panel, under its label and above its bottom rule, and how many figures each holds
BANDS = {'idle': ((20, 108, 298, 228), 2), 'walk': ((318, 108, 910, 228), 4),
         'front': ((20, 268, 472, 402), 5), 'back': ((490, 268, 916, 402), 5),
         'attack': ((20, 442, 916, 554), 7), 'hit': ((20, 592, 452, 700), 3),
         'death': ((468, 592, 1516, 700), 7), 'sprint': ((20, 736, 766, 834), 7)}


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
        if sl[1].stop - sl[1].start > 300 and sl[0].stop - sl[0].start < 8:
            continue                                                       # a panel's rule
        (big if area >= 1500 else small if area >= 40 else []).append(d)
    big.sort(key=lambda d: d['x0'])
    assert len(big) == n, (name, len(big))
    for s in small:                                                        # a hoof or a tail apart: the figure over it
        cx = (s['x0'] + s['x1']) / 2
        g = min(big, key=lambda b: 0 if b['x0'] <= cx < b['x1'] else min(abs(cx - b['x0']), abs(cx - b['x1'])))
        g['ids'] += s['ids']; g['y0'] = min(g['y0'], s['y0']); g['y1'] = max(g['y1'], s['y1'])
        g['x0'] = min(g['x0'], s['x0']); g['x1'] = max(g['x1'], s['x1'])
    ty, by = min(g['y0'] for g in big), max(g['y1'] for g in big)       # the row's own window, top to ground
    out = []
    for g in big:
        mm = ndimage.binary_fill_holes(np.isin(lab, g['ids']) & m0)
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
    """the middle of the body: the median opaque column over the torso's rows (the snout and the tail are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 70 // 100 + 1, :, 3] > 0
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
    hw = lambda ds: (np.mean([d['h'] for d in ds]), np.mean([d['w'] for d in ds]))
    wh, ww = hw(rows['walk'])
    side_s = wh / STAND                                                    # the walk, by its height
    fb_s = np.mean([d['h'] for d in rows['front'] + rows['back']]) / STAND   # the walks toward and away: their own

    def row_s(k):
        """the page draws its lower rows smaller (the sprint ~0.77, the gore ~0.9): each row back to the walk's size, by its
        figures' height and length together (the death row by its first figure, still on its feet)"""
        h, w = hw(rows[k][:1] if k == 'death' else rows[k])
        return side_s * np.sqrt((h / wh) * (w / ww))
    ss = {k: row_s(k) for k in ('idle', 'walk', 'attack', 'death', 'hit', 'sprint')}
    print('  scales: ' + ', '.join('%s %.2f' % (k, side_s / v) for k, v in ss.items()) + ' (x the walk); front/back %.3f' % fb_s)

    def cut(k, s):
        return [place(a, torso_x(a), '%s%d' % (k, i)) for i, a in enumerate(fit(d['img'], s) for d in rows[k])]
    idle2, walk4, atk_r, hurt_r, flinch_r, run_r = (cut(k, ss[k]) for k in ('idle', 'walk', 'attack', 'death', 'hit', 'sprint'))
    front, back = cut('front', fb_s), cut('back', fb_s)
    idle_r, walk_r = [idle2[0]] * 4 + [idle2[1]] * 4, walk4 * 2
    idle_l, walk_l, atk_l, hurt_l, flinch_l, run_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(hurt_r), mirror(flinch_r), mirror(run_r)
    fS, fN = front[0], back[0]
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    dip = [0, 0, 1, 2, 3, 3, 1]                                            # (the gore's seven frames: the head down at the eye)

    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'flinch': [], 'run': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        if f == 0:
            frames['idle'].append([fS] * 4 + [breathe(fS)] * 4); frames['walk'].append(front[:4] * 2); frames['run'].append([front[i % 4] for i in range(7)])  # (seven, as the sprint: one count an anim)
            frames['attack'].append([shift(fS, 0, d) for d in dip]); frames['hurt'].append(hurt_r); frames['flinch'].append(flinch_r)
        elif f == 4:
            frames['idle'].append([fN] * 4 + [breathe(fN)] * 4); frames['walk'].append(back[:4] * 2); frames['run'].append([back[i % 4] for i in range(7)])
            frames['attack'].append([shift(fN, 0, -d) for d in dip]); frames['hurt'].append(hurt_l); frames['flinch'].append(flinch_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r)
            frames['hurt'].append(hurt_r); frames['flinch'].append(flinch_r); frames['run'].append(run_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l)
            frames['hurt'].append(hurt_l); frames['flinch'].append(flinch_l); frames['run'].append(run_l)
    for t in CLIPPED:
        print('  CLIPPED', t)
    return frames


def write(frames):
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(meta_p))
    for k, v in {'idle': 4, 'walk': 9, 'attack': 12, 'hurt': 8, 'flinch': 12, 'run': 14}.items():
        meta['anims'][k]['fps'] = v
    meta['source'] = 'generated by Griz (2026-09-30, one sheet of two), cut and snapped by tools/boar-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


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
    out = os.path.join(ROOT, 'dev', 'shots', 'boar-cuts.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    Image.fromarray(img, 'RGB').save(out)
    print('  wrote', out, img.shape[1], 'x', img.shape[0])


if __name__ == '__main__':
    fr = build()
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview(fr)
    else:
        write(fr)
