"""DEEP16 pipeline 2 (generated art): Griz's generated character sheet for Denny -> a palette sprite sheet.

    python tools/denny-sheet.py

Source: deep16/_src/denny_sheet_2.webp (Griz, 2026-09-27; a turnaround, an 8-frame walk facing right, extra poses).
The generated art is pixel-styled but soft (thousands of colours, off-grid), so each figure is cut from the dark
background, boxed down to game size, snapped to deep16/palette.json and outlined by the same pass as the renders.
Four views cover eight facings: the side views take the diagonals; walking west mirrors the walk east; walking north
and south bob the back and front views.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src', 'denny_sheet_2.webp')
BG = np.array([25, 21, 18])
TARGET_H = 52            # Denny stands a little under the humans' 56
FW, FH, AX, AY = 96, 96, 48, 84

# boxes on the sheet (x0, y0, x1, y1), from the component pass
VIEWS = {'front': (135, 56, 341, 303), 'right': (415, 59, 582, 306), 'back': (656, 63, 847, 303), 'left': (893, 60, 1058, 306)}
WALK = [(44, 418, 177, 606), (194, 419, 323, 606), (337, 420, 464, 604), (472, 420, 597, 605),
        (613, 422, 740, 607), (752, 419, 880, 606), (894, 420, 1014, 605), (1032, 417, 1164, 606)]
POSE_IDLE, POSE_RUN = (30, 731, 180, 925), (233, 739, 375, 920)
POSE_JUMP, POSE_POINT = (415, 704, 561, 903), (595, 732, 765, 929)   # (the MPMon's stand-ins, 10-06: tools/denny-sheet.py's component pass over the poses band)

sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)


def cut(box, pad=6):
    x0, y0, x1, y1 = box
    c = sheet[y0 - pad:y1 + pad, x0 - pad:x1 + pad]
    m = np.abs(c - BG).sum(-1) > 30
    m = ndimage.binary_fill_holes(ndimage.binary_opening(m, iterations=1))
    lab, n = ndimage.label(m)                     # keep the figure, drop stray specks
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(m)
    c, m = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    rgba = np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def game_size(img, scale):
    w, h = img.size
    return img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)


def body_x(a, head_band=(0.12, 0.45)):
    """x of the head's centre (the steadiest thing in a walk): rows in the head band, mean of opaque columns."""
    h = a.shape[0]
    band = a[int(h * head_band[0]):int(h * head_band[1]), :, 3] > 0
    ys, xs = np.where(band)
    return float(xs.mean()) if len(xs) else a.shape[1] / 2


def place(a, x_ref, dy=0):
    """a 1x RGBA array onto a FW x FH frame: x_ref at AX, the lowest opaque row on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rows = np.where(a[..., 3].any(axis=1))[0]
    bottom = rows[-1]
    ox, oy = int(round(AX - x_ref)), AY - bottom + dy
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def breathe(fr):
    """idle frame 2: the top of the figure sinks a pixel (the feet stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] + 1:mid + 1] = fr[rows[0]:mid]
    o[rows[0]] = 0
    return o


def main():
    vscale = (VIEWS['front'][3] - VIEWS['front'][1]) / TARGET_H
    views = {}
    for k, box in VIEWS.items():
        a = pix.pixelate(game_size(cut(box), vscale), 1, do_lift=False)
        views[k] = a
    # the side views: anchor on the feet (the tail sits behind), measured once and reused for the walk
    def feet_x(a):
        rows = np.where(a[..., 3].any(axis=1))[0]
        band = a[rows[-1] - 4:rows[-1] + 1, :, 3] > 0
        return float(np.where(band)[1].mean())
    right_off = body_x(views['right']) - feet_x(views['right'])
    idle = {'front': place(views['front'], feet_x(views['front'])), 'back': place(views['back'], feet_x(views['back'])),
            'right': place(views['right'], feet_x(views['right'])), 'left': place(views['left'], feet_x(views['left']))}

    wscale = np.mean([b[3] - b[1] for b in WALK]) / TARGET_H
    walk_r = []
    for b in WALK:
        a = pix.pixelate(game_size(cut(b), wscale), 1, do_lift=False)
        walk_r.append(place(a, body_x(a) - right_off))
    walk_l = [fr[:, ::-1].copy() for fr in walk_r]

    # facings S, SW, W, NW, N, NE, E, SE
    idle_by = ['front', 'left', 'left', 'left', 'back', 'right', 'right', 'right']
    frames = {'idle': [], 'walk': []}
    for f in range(8):
        base = idle[idle_by[f]]
        frames['idle'].append([base, base, breathe(base), breathe(base)])
        if f == 0:
            frames['walk'].append([np.roll(idle['front'], -(i % 2), axis=0) for i in range(8)])
        elif f == 4:
            frames['walk'].append([np.roll(idle['back'], -(i % 2), axis=0) for i in range(8)])
        elif f in (5, 6, 7):
            frames['walk'].append(walk_r)
        else:
            frames['walk'].append(walk_l)
    # the attack: no swing on his sheet, so a lunge -- the run pose thrown forward and back (the flail's arc is the engine's)
    pscale = (POSE_IDLE[3] - POSE_IDLE[1]) / TARGET_H
    run = pix.pixelate(game_size(cut(POSE_RUN), pscale), 1, do_lift=False)
    run_r = place(run, body_x(run) - right_off)
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    frames['attack'] = []
    for f in range(8):
        if f == 0:
            b = idle['front']; seq = [b, shift(b, 0, 2), shift(b, 0, 4), shift(b, 0, 2)]
        elif f == 4:
            b = idle['back']; seq = [b, shift(b, 0, -2), shift(b, 0, -4), shift(b, 0, -2)]
        elif f in (5, 6, 7):
            seq = [idle['right'], shift(run_r, 2, 0), shift(run_r, 5, 0), shift(run_r, 2, 0)]
        else:
            seq = [idle['left'], shift(run_r[:, ::-1], -2, 0), shift(run_r[:, ::-1], -5, 0), shift(run_r[:, ::-1], -2, 0)]
        frames['attack'].append(seq)
    # the MPMon's rows (10-06, deep16/js/mpmon.js: Denny is a Monster Party PC of his own now), stand-ins from the poses till his third
    # sheet comes (its prompt: they live/beholda/deep16-translation.md): TAUNT -- the Point pose, a jab of the finger; CANNONBALL -- the
    # Jump pose rising and coming down; DENIM DAMAGE -- the run pose thrown harder than the attack's lunge
    point = pix.pixelate(game_size(cut(POSE_POINT), pscale), 1, do_lift=False)
    point_r = place(point, body_x(point) - right_off)
    jump = pix.pixelate(game_size(cut(POSE_JUMP), pscale), 1, do_lift=False)
    jump_r = place(jump, body_x(jump) - right_off)
    frames['taunt'], frames['cannonball'], frames['denimdamage'] = [], [], []
    for f in range(8):
        west = f in (1, 2, 3)
        side = lambda fr: fr[:, ::-1].copy() if west else fr
        d = -1 if west else 1
        P, J, Rn, I = side(point_r), side(jump_r), side(run_r), (idle['front'] if f == 0 else idle['back'] if f == 4 else idle['left'] if west else idle['right'])
        frames['taunt'].append([I, P, shift(P, 0, -1), P])
        frames['cannonball'].append([I, shift(J, 0, -4), shift(J, d * 2, -7), shift(J, d * 3, -3)])
        frames['denimdamage'].append([I, shift(Rn, -d * 2, 0), shift(Rn, d * 6, 0), shift(Rn, d * 8, 0), shift(Rn, d * 3, 0)])
    pix.write_sheet('denny_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'denny_p2.json')
    meta = json.load(open(meta_p)); meta['anims']['idle']['fps'] = 2; meta['source'] = 'generated by Griz (2026-09-27), cleaned by tools/denny-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    main()
