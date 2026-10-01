"""DEEP16 pipeline 2 (generated art): Griz's clacker sheets -> the clacker's palette sprite sheet.

    python tools/clacker-sheet.py            # deep16/art/clacker_p2.png + .json
    python tools/clacker-sheet.py preview    # dev/shots/clacker-cuts.png: every anim, facings S, E and N side by side, 2x, on grey

Sources (Griz, 2026-10-01, Grok, from his front portrait of it and the art list's Q2 head; his copies are dev/visions/clacker2*.jpg):
  deep16/_src/clacker_grok_2.jpg   the sheet: a turnaround (Front, Right, Back, Left), idle 7, walk 7, hook 6 (unusable), clack 6,
                                   climb 6 (not used: no walls to climb on the grid), hurt 6, death 8 -- all facing right
  deep16/_src/clacker_grok_3.jpg   "a second sheet to replace the unusable hook attack that came with clacker2": hook 6, facing right,
                                   drawn larger and paler -- brought to the sheet's scale and its hide's tones before the palette
The first sheet (GPT's, clacker_grok_1.png, cut as clacker_p1 that morning) is retired: "they 'hook' with their noses by the noses
growing :) also their arms are all akilter, particularly in idle". What each became:
    idle    <- the IDLE row (7)
    walk    <- the WALK row (7)
    attack  <- the replacement HOOK row (6)
    clack   <- the CLACK row (6): played at the start of each of its turns, a clack on the strikes (deep16/js/ai.js)
    hurt    <- the DEATH row (8): the engine plays `hurt` once when a creature goes down, as every generated sheet does
    flinch  <- the HURT row (6)
Facings: the rows take the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored); S is the Front still (breathing; the walk a bob
of it; the attack a dip), N the Back still the same way; S/N take the side frames for hurt and flinch, the clack as drawn. One scale for
the sheet's rows, set by the idle row's height so the clacker stands STAND px; the turnaround its own (by its Right still against the
idle's first frame); the replacement hook its own (by its figures' height against the idle's). Each row is cut over one common window
(its own top to its ground), so a lifted foot stays lifted; each frame is placed on its torso. Small pieces apart from a figure (a hook
tip) go to the figure whose columns they fall in; only small holes are filled, so the sheet's navy between a hook and an arm stays open.
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
NAME = 'clacker_p2'
FW, FH, AX, AY = 160, 112, 80, 102
STAND = 72                                              # px of clacker from its feet to the top of its back, before the outline


def load(fn):
    a = np.asarray(Image.open(os.path.join(SRC, fn)).convert('RGB')).astype(np.int32)
    v, c = np.unique(a.reshape(-1, 3) // 8, axis=0, return_counts=True)
    return a, v[np.argmax(c)] * 8 + 4                    # the ground: the commonest colour (the sheets' navy), jpeg-blurred
SHEETS = {'s': load('clacker_grok_2.jpg'), 'h': load('clacker_grok_3.jpg')}
# the bands (sheet, x0, y0, x1, y1): right of the row labels, clear of the frame numbers; how many figures each holds
BANDS = {'idle': (('s', 90, 240, 780, 370), 7), 'walk': (('s', 90, 392, 780, 510), 7), 'clack': (('s', 90, 662, 780, 795), 6),
         'hurt': (('s', 90, 955, 780, 1040), 6), 'death': (('s', 90, 1058, 780, 1142), 8),
         'front': (('s', 290, 20, 400, 205), 1), 'right': (('s', 415, 20, 510, 205), 1), 'back': (('s', 525, 20, 630, 205), 1),
         'hook': (('h', 0, 250, 1168, 520), 6)}
THR = 60                                                # a pixel this far from the navy is the figure's (the jpeg's halo isn't)


def frames_in(name):
    """the n figures in a row's band, left to right: {'img': RGBA cut over the row's common window, 'h': its own height}."""
    (sk, x0, y0, x1, y1), n = BANDS[name]
    A, BG = SHEETS[sk]
    c = A[y0:y1, x0:x1]
    m0 = np.abs(c - BG).sum(-1) > THR
    m0 = ndimage.binary_opening(m0, iterations=1) | (m0 & ndimage.binary_erosion(m0))   # (lone jpeg specks off)
    m = ndimage.binary_closing(np.pad(m0, 6), iterations=2)[6:-6, 6:-6]
    lab, k = ndimage.label(m)
    big, small, ds = [], [], []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        ds.append({'ids': [i + 1], 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop, 'area': area})
    top = max(d['area'] for d in ds)                   # (a figure is a third of the band's biggest: a hook drawn apart is a piece)
    for d in ds:
        (big if d['area'] >= top / 3 else small if d['area'] >= 20 else []).append(d)
    big.sort(key=lambda d: d['x0'])
    assert len(big) == n, (name, len(big), [(b['x0'], b['area']) for b in big])
    for s in small:
        cx = (s['x0'] + s['x1']) / 2
        g = min(big, key=lambda b: 0 if b['x0'] <= cx < b['x1'] else min(abs(cx - b['x0']), abs(cx - b['x1'])))
        if abs(cx - (g['x0'] + g['x1']) / 2) > (g['x1'] - g['x0']):
            continue                                   # (a number or a label's bit, far from any figure)
        g['ids'] += s['ids']; g['y0'] = min(g['y0'], s['y0']); g['y1'] = max(g['y1'], s['y1'])
        g['x0'] = min(g['x0'], s['x0']); g['x1'] = max(g['x1'], s['x1'])
    ty, by = min(g['y0'] for g in big), max(g['y1'] for g in big)
    out = []
    for g in big:
        mm = np.isin(lab, g['ids']) & m0
        hl, nh = ndimage.label(ndimage.binary_fill_holes(mm) & ~mm)
        if nh:
            sizes = ndimage.sum(np.ones_like(hl), hl, range(1, nh + 1))
            mm = mm | np.isin(hl, [i + 1 for i, s in enumerate(sizes) if s < 30])
        cc = c[ty:by, g['x0']:g['x1']]
        am = mm[ty:by, g['x0']:g['x1']]
        out.append({'rgb': cc.astype(np.float64), 'a': am, 'h': g['y1'] - g['y0'], 'w': g['x1'] - g['x0']})
    return out


def tone(rows_from, rows_to):
    """the replacement hook's colours brought to the sheet's hide: each channel's mean and spread over the figures matched."""
    src = np.concatenate([d['rgb'][d['a']] for d in rows_from]); dst = np.concatenate([d['rgb'][d['a']] for d in rows_to])
    mu_s, sd_s, mu_d, sd_d = src.mean(0), src.std(0) + 1e-6, dst.mean(0), dst.std(0)
    for d in rows_from:
        d['rgb'] = np.clip((d['rgb'] - mu_s) / sd_s * sd_d + mu_d, 0, 255)


def img_of(d):
    return Image.fromarray(np.dstack([d['rgb'].astype(np.uint8), (d['a'] * 255).astype(np.uint8)]), 'RGBA')


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
    tone(rows['hook'], rows['idle'] + rows['walk'])
    ih = np.median([d['h'] for d in rows['idle']])
    side_s = ih / STAND
    turn_s = side_s * rows['right'][0]['h'] / rows['idle'][0]['h']
    hook_s = side_s * np.median([d['h'] for d in rows['hook']]) / ih
    # the page draws its HURT and DEATH rows smaller than the idle (~72 px against ~115): each brought back by its figures' height and
    # width together (the death row by its first figure, still on its feet), the boar's way (tools/boar-sheet.py row_s)
    iw = np.median([d['w'] for d in rows['idle']])
    def row_s(k):
        ds = rows[k][:1] if k == 'death' else rows[k]
        return side_s * np.sqrt((np.median([d['h'] for d in ds]) / ih) * (np.median([d['w'] for d in ds]) / iw))
    hurt_s, death_s = row_s('hurt'), row_s('death')
    print('  scale %.2f (rows), %.2f (turnaround), %.2f (the hook), %.2f / %.2f (hurt / death)' % (side_s, turn_s, hook_s, hurt_s, death_s))

    def cut(k, s):
        return [place(a, torso_x(a), '%s%d' % (k, i)) for i, a in enumerate(fit(img_of(d), s) for d in rows[k])]
    idle_r, walk_r, clack_r = (cut(k, side_s) for k in ('idle', 'walk', 'clack'))
    flinch_r, hurt_r = cut('hurt', hurt_s), cut('death', death_s)
    atk_r = cut('hook', hook_s)
    fS, fN = cut('front', turn_s)[0], cut('back', turn_s)[0]
    idle_l, walk_l, atk_l, clack_l, flinch_l, hurt_l = (mirror(x) for x in (idle_r, walk_r, atk_r, clack_r, flinch_r, hurt_r))
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    dip = [0, 1, 2, 3, 2, 1]                                              # (the hook's six frames, from the front: a lunge at the eye)
    bob = [0, -1, -1, 0, -1, -1, 0]                                       # (the walk toward and away: a stride's rise, seven as the walk)

    frames = {'idle': [], 'walk': [], 'attack': [], 'clack': [], 'hurt': [], 'flinch': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        if f in (0, 4):
            st = fS if f == 0 else fN
            frames['idle'].append([st] * 4 + [breathe(st)] * 3); frames['walk'].append([shift(st, 0, b) for b in bob])
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
    for k, v in {'idle': 6, 'walk': 9, 'attack': 11, 'clack': 10, 'hurt': 8, 'flinch': 12}.items():
        meta['anims'][k]['fps'] = v
    meta['source'] = 'generated by Griz (2026-10-01, two Grok sheets), cut and snapped by tools/clacker-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    # kept as an indexed PNG: the colours are already the palette's, so every pixel survives exactly (index 0 the clear)
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
                img[y + (AY - cy0 + 1) * S, x + i * cw * S:x + (i + 1) * cw * S] = (160, 60, 60)
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
