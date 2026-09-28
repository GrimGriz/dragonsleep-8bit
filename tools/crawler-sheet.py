"""DEEP16 pipeline 2 (generated art): Griz's generated carrion-crawler sheet -> a palette sprite sheet.

    python tools/crawler-sheet.py

Source: deep16/_src/crawler_grok_1.webp (Griz, 2026-09-27, made with Grok): one page in one hand -- a portrait, three
views (side, front, top), and rows seen from the side facing right: idle 8, crawl 8, tentacles 8, bite 5, hurt 4, death 8.
Its colours stand as drawn (pale yellow body, red tentacles), snapped to the palette; no regrade (the chuul's was).
Facings: the front view takes S; the top view takes N (Griz, 09-27: "build it with the top view for N": the sheet has no
rear view); the side rows take the other six (mirrored for the west side). The death row plays as `hurt` (the engine
plays it once when a creature goes down), as the chuul's does. The bite and the flinch rows are cut but not yet played.
Boxes from a component pass over the sheet (warm pixels against the navy ground).
"""
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SHEET = np.asarray(Image.open(os.path.join(ROOT, 'deep16', '_src', 'crawler_grok_1.webp')).convert('RGB')).astype(np.int32)
BG = np.array([12, 20, 31])
FW, FH, AX, AY = 170, 104, 85, 94
SIDE_H = 50                  # Large, and low: the side rows stand ~50 px (the humans are 56 tall; it is 3-4 ft high, 9 long)

SIDE_V, FRONT_V, TOP_V = (874, 120, 1007, 214), (1036, 104, 1141, 218), (1197, 106, 1270, 220)   # the panel's views
IDLE = [(52, 304, 164, 379), (208, 296, 316, 379), (356, 297, 471, 380), (513, 299, 627, 380), (672, 304, 785, 376),
        (828, 310, 940, 376), (988, 298, 1104, 376), (1151, 303, 1266, 376)]
WALK = [(34, 444, 164, 513), (196, 441, 332, 514), (354, 445, 489, 513), (512, 442, 649, 514), (670, 440, 807, 513),
        (829, 434, 966, 513), (989, 442, 1129, 513), (1150, 449, 1282, 514)]
ATTACK = [(43, 573, 157, 647), (200, 576, 319, 648), (354, 569, 476, 646), (516, 580, 642, 650), (677, 569, 804, 650),
          (836, 572, 966, 651), (995, 577, 1126, 651), (1153, 580, 1269, 650)]
DEATH = [(55, 971, 149, 1037), (220, 964, 329, 1042), (383, 964, 494, 1042), (553, 968, 656, 1042), (710, 993, 823, 1042),
         (863, 974, 976, 1042), (1014, 1003, 1128, 1040), (1167, 1007, 1278, 1039)]


def cut(box, pad=5):
    x0, y0, x1, y1 = box
    c = SHEET[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    m = np.abs(c - BG).sum(-1) > 45                      # off the navy ground (the drawing's dark outline included)
    m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))              # the creature, not a frame number
    ys, xs = np.where(m)
    c, m = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)]), 'RGBA')


def figure(box, scale):
    img = cut(box)
    w, h = img.size
    img = img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)
    return pix.pixelate(img, 1, do_lift=False)


def place(a, x_ref, dy=0):
    """a 1x RGBA array onto a frame: x_ref at AX, the lowest opaque row on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rows = np.where(a[..., 3].any(axis=1))[0]
    ox, oy = int(round(AX - x_ref)), AY - rows[-1] + dy
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def left_x(a):
    return float(np.where(a[..., 3].any(axis=0))[0][0])


def main():
    s_rows = np.mean([b[3] - b[1] for b in IDLE]) / SIDE_H
    s_panel = s_rows * (SIDE_V[3] - SIDE_V[1]) / np.mean([b[3] - b[1] for b in IDLE])   # the panel draws a little bigger
    s_panel = (SIDE_V[3] - SIDE_V[1]) / SIDE_H
    centre = lambda a: np.where(a[..., 3].any(axis=0))[0].mean()
    front, top = figure(FRONT_V, s_panel), figure(TOP_V, s_panel)
    fS, fN = place(front, centre(front)), place(top, centre(top))

    idle = [figure(b, s_rows) for b in IDLE]
    half = idle[0].shape[1] / 2                          # the tail end holds still; the body's middle on the foot
    side = lambda a: place(a, left_x(a) + half)
    idle_r = [side(a) for a in idle]
    walk_r = [side(figure(b, s_rows)) for b in WALK]
    atk_r = [side(figure(b, s_rows)) for b in ATTACK]
    death_r = [side(figure(b, s_rows)) for b in DEATH]
    mirror = lambda seq: [fr[:, ::-1].copy() for fr in seq]
    idle_l, walk_l, atk_l, death_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(death_r)

    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        if f in (0, 4):
            b = fS if f == 0 else fN
            frames['idle'].append([b, b, shift(b, 0, 1), shift(b, 0, 1)])
            frames['walk'].append([shift(b, 0, -(i % 2)) for i in range(8)])
            lunge = 2 if f == 0 else -2
            frames['attack'].append([b, shift(b, 0, lunge), shift(b, 0, 2 * lunge), shift(b, 0, lunge)])
            frames['hurt'].append(death_r if f == 0 else death_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r); frames['hurt'].append(death_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l); frames['hurt'].append(death_l)
    # (a row's frame count must match across facings: the front and top views fill theirs out)
    n = {k: max(len(r) for r in v) for k, v in frames.items()}
    for k, rows in frames.items():
        for i, r in enumerate(rows):
            while len(r) < n[k]: r = r + r[:n[k] - len(r)]
            rows[i] = r[:n[k]]
    pix.write_sheet('crawler_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'crawler_p2.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 5; meta['anims']['walk']['fps'] = 10; meta['anims']['attack']['fps'] = 10; meta['anims']['hurt']['fps'] = 8
    meta['source'] = 'generated by Griz with Grok (2026-09-27), cut and snapped by tools/crawler-sheet.py (the top view stands for N)'
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    main()
