r"""DEEP16 pipeline 2 (generated art): Beholda's first sheet -> beholda_p2, the MPMon's figure on the grid (10-06, js/mpmon.js).

    python tools/beholda-sheet.py

Source: deep16/_src/beholda_grok_1.webp (Griz's, 10-06; the master is they live\beholda\src\beholda-sheet-1.webp, cut for his
stream show by they live\beholda\pipeline\slice.py). Rows, all but one in a three-quarter front view: Hover Idle 8, Hover Move 8,
Attack Wind-up 8, the Big Screen Projection 5 (side view facing right; five figures under six numbers), Hurt/Recoil 7 (numbered
1-5, 7, 8), Victory 7. A STAND-IN till her second sheet comes (its prompt: they live\beholda\deep16-translation.md): the front view
serves every facing (mirrored for the west three), Dice Slam is the wind-up thrown forward, and there is no fall row -- the engine
lays a figure with none on its side.

The cut is the stream pipeline's: alpha by distance from the sheet's flat navy, the navy un-mixed from the soft edge, each row scaled
by the lime d8 hanging on her right (rigid, drawn alike in every frame -- the honest ruler), the projection's frames pinned by the
middle die so her body holds still when the wind-up hands over to it. Then boxed down to game size, snapped to deep16/palette.json and
outlined by the same pass as every sheet. She hovers: the lowest die HOVER px over the foot line, each frame's own bob kept.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src', 'beholda_grok_1.webp')
NAVY = np.array([1, 12, 32], float)
LO, HI = 16, 58
FW, FH, AX, AY = 96, 96, 48, 84
GW = 192                  # the projection's frames: the cone reaches past a 96-px cell, so its row is twice as wide (the anchor centred)
TARGET_H = 50             # the idle figure, eyestalk tips to the lowest die (a human stands 56, Denny 52)
HOVER = 6                 # the lowest die this far above the foot line
BANDS = {'idle': (44, 174, 420, 1490), 'move': (240, 360, 420, 1490), 'windup': (425, 550, 420, 1490),
         'blast': (606, 711, 612, 1490), 'hurt': (742, 845, 568, 1490), 'victory': (874, 983, 560, 1490)}

src = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
AL = np.clip((np.abs(src - NAVY).max(2) - LO) / (HI - LO), 0, 1)


def blob(rgb, a, test, below=None, left_of=None):
    m = test(rgb.astype(int)) & (a > 0.8)
    if below is not None: m[: int(m.shape[0] * below)] = False
    if left_of is not None: m[:, int(left_of):] = False
    lab, k = ndi.label(ndi.binary_closing(m, iterations=2))
    if not k: return None
    sz = ndi.sum(m, lab, range(1, k + 1)); i = int(np.argmax(sz)) + 1
    ys, xs = np.where(lab == i)
    return xs.min(), xs.max(), ys.min(), ys.max()


LIME = lambda c: (c[..., 1] > 140) & (c[..., 2] < 110) & (c[..., 0] > 90) & (c[..., 0] < 220)
MAGENTA = lambda c: (c[..., 0] > 170) & (c[..., 1] < 110) & (c[..., 2] > 150)
WHITE = lambda c: c.min(-1) > 205


def cut_row(name):
    y0, y1, x0, x1 = BANDS[name]
    A = AL[y0:y1, x0:x1]; S = src[y0:y1, x0:x1]
    solid = A > 0.5
    lab, k = ndi.label(ndi.binary_dilation(solid, iterations=3))
    keep = [i + 1 for i, s in enumerate(ndi.find_objects(lab)) if (solid[s] & (lab[s] == i + 1)).sum() > 900 and s[0].stop - s[0].start > 45]
    core = np.zeros_like(lab)
    for j, i in enumerate(keep): core[lab == i] = j + 1
    dist, (iy, ix) = ndi.distance_transform_edt(core == 0, return_indices=True)
    near = core[iy, ix]
    with np.errstate(divide='ignore', invalid='ignore'):
        fg = np.clip(np.where(A[..., None] > 0.02, NAVY + (S - NAVY) / np.maximum(A, 1e-3)[..., None], S), 0, 255)
    out = []
    for j in range(1, len(keep) + 1):
        reg = (near == j) & (dist <= (26 if name == 'blast' else 14)) & (A > 0.03)
        cols = np.where(reg.any(0))[0]; rows = np.where(reg.any(1))[0]
        c0, c1, r0, r1 = cols.min(), cols.max() + 1, rows.min(), rows.max() + 1
        a = (A * reg)[r0:r1, c0:c1]; rgb = fg[r0:r1, c0:c1]
        m = (core == j)[r0:r1, c0:c1] & (a > 0.5)
        die = blob(rgb, a, LIME)
        eye = blob(rgb, a, WHITE)
        if name == 'blast':
            mag = blob(rgb, a, MAGENTA, below=0.66, left_of=((eye[0] + eye[1]) / 2 + 6) if eye else None)
            axv = (mag[0] + mag[1]) / 2 if mag else (cols.min() - c0 + 50)
        else:
            xs = np.where(m.any(0))[0]; axv = (xs.min() + xs.max()) / 2
        ys = np.where(m.any(1))[0]
        out.append(dict(x=c0, rgba=np.dstack([rgb, a * 255]).astype(np.uint8), ax=axv, bottom=float(ys.max()), top=float(ys.min()), r0=r0,
                        die=((die[1] - die[0] + 1) + (die[3] - die[2] + 1)) / 2 if die else None))
    out.sort(key=lambda f: f['x'])
    return out


def game(frame, k, row_bottom, wide=False):
    """one source frame -> a game cell: boxed down by k, snapped and outlined, its anchor at AX (or the wide cell's middle), its lowest
    die HOVER over the foot line with the frame's own bob (its bottom against the row's) kept"""
    im = Image.fromarray(frame['rgba'], 'RGBA')
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.BOX)
    a = pix.pixelate(im, 1, do_lift=False)
    fw, ax = (GW, GW // 2) if wide else (FW, AX)
    cell = np.zeros((FH, fw, 4), np.uint8)
    bob = (frame['r0'] + frame['bottom'] - row_bottom) * k
    ox = int(round(ax - frame['ax'] * k)); oy = int(round(AY - HOVER - frame['bottom'] * k + bob))
    h, w = a.shape[:2]
    ys0, xs0 = max(0, oy), max(0, ox); ys1, xs1 = min(FH, oy + h), min(fw, ox + w)
    if ys1 > ys0 and xs1 > xs0: cell[ys0:ys1, xs0:xs1] = a[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
    return cell


def main():
    rows = {n: cut_row(n) for n in BANDS}
    idle_h = float(np.median([f['bottom'] - f['top'] for f in rows['idle']]))
    die_game = float(np.median([f['die'] for f in rows['idle'] if f['die']])) * TARGET_H / idle_h
    cells = {}
    for n, fr in rows.items():
        k = die_game / float(np.median([f['die'] for f in fr if f['die']]))
        rb = float(np.median([f['r0'] + f['bottom'] for f in fr]))
        cells[n] = [game(f, k, rb, wide=(n == 'blast')) for f in fr]
        print('  %-8s %d frames, scale %.3f' % (n, len(fr), k))
    mir = lambda seq: [c[:, ::-1].copy() for c in seq]
    shift = lambda c, dx, dy: np.roll(np.roll(c, dx, axis=1), dy, axis=0)
    WEST = (1, 2, 3)   # facings S SW W NW N NE E SE: the west three mirror
    frames = {'idle': [], 'walk': [], 'attack': [], 'cast': [], 'flinch': []}
    for f in range(8):
        flip = f in WEST
        pick = lambda seq: mir(seq) if flip else seq
        frames['idle'].append(pick(cells['idle']))
        frames['walk'].append(pick(cells['move']))
        frames['cast'].append(pick(cells['windup']))
        frames['flinch'].append(pick(cells['hurt']))
        # Dice Slam, a stand-in: the wind-up's first four, thrown toward the facing and back (her second sheet brings the swing)
        dx, dy = {0: (0, 2), 4: (0, -2)}.get(f, (-3 if flip else 3, 0))
        w4 = pick(cells['windup'][:4])
        frames['attack'].append([w4[0], shift(w4[1], dx, dy), shift(w4[2], 2 * dx, 2 * dy), shift(w4[3], dx, dy)])
    # the gaze: the projection, east as drawn and west mirrored; south and north the wind-up's last five, centred in the wide cell
    pad = lambda c: np.pad(c, ((0, 0), ((GW - FW) // 2, (GW - FW) // 2), (0, 0)))
    frames['gaze'] = []
    for f in range(8):
        if f in (0, 4): frames['gaze'].append([pad(c) for c in cells['windup'][3:8]])
        elif f in WEST: frames['gaze'].append(mir(cells['blast']))
        else: frames['gaze'].append(cells['blast'])
    pix.write_sheet('beholda_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY), sizes={'gaze': (GW, FH, GW // 2, AY)})
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'beholda_p2.json')
    meta = json.load(open(meta_p)); meta['anims']['idle']['fps'] = 6
    meta['source'] = 'generated by Griz (2026-10-06), her first sheet as a stand-in; cut by tools/beholda-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    main()
