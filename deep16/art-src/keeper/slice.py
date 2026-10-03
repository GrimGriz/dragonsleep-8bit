"""Slice Grok's two Keeper sheets (grok-sheet-1/2.webp) into frames and pack keeper_p2.
Run from this folder: python slice.py   (needs pillow, numpy, scipy)
Frames land in frames/, the packed sheet in ../../art/keeper_p2.png, a contact sheet in contact.png.
Boxes are bands read off the pictures; the cut inside a band is by brightness (the sheets have no alpha)."""
from PIL import Image
import numpy as np, json, os
from scipy import ndimage as ndi

# band = (y0, y1, x0, x1) per sheet per anim; the 4 turnaround figures sit in the header band
BANDS = {
 1: {'turn': (10, 222, 340, 1020), 'idle': (243, 368, 280, 1100), 'wall': (392, 498, 280, 1150),
     'dive': (528, 620, 270, 1150), 'wave': (648, 742, 270, 1160)},
 2: {'turn': (50, 240, 540, 1100), 'idle': (238, 360, 270, 820), 'wall': (372, 500, 270, 1060),
     'dive': (510, 612, 250, 1150), 'wave': (625, 750, 250, 1130)},
}
THR_LO, THR_HI = 38, 75
CUTS = {(1, 'wave'): [545]}   # frames that touch on the sheet: cut the columns here before labelling     # luminance ramp: below = background, above = solid

def alpha_of(a):
    lum = a.sum(2) / 3.0
    return np.clip((lum - THR_LO) / (THR_HI - THR_LO), 0, 1)

def cut(n):
    src = Image.open(f'grok-sheet-{n}.webp').convert('RGB')
    a = np.array(src)
    al = alpha_of(a.astype(float))
    res = {}
    for name, (y0, y1, x0, x1) in BANDS[n].items():
        band = al[y0:y1, x0:x1] > 0.5
        for cx in CUTS.get((n, name), []):
            band[:, max(cx - x0 - 1, 0):cx - x0 + 2] = False
        lab, k = ndi.label(ndi.binary_dilation(band, iterations=3))
        core = np.zeros_like(lab)
        keep = []
        for i, s in enumerate(ndi.find_objects(lab)):
            area = (band[s] & (lab[s] == i + 1)).sum()
            if area > 600 and s[0].stop - s[0].start > 40:
                keep.append(i + 1)
        # nearest-core assignment keeps bubbles/splash with their frame and drops the number captions below
        for j, i in enumerate(keep): core[lab == i] = j + 1
        dist, (iy, ix) = ndi.distance_transform_edt(core == 0, return_indices=True)
        near = core[iy, ix]
        frames = []
        for j in range(1, len(keep) + 1):
            ys, xs = np.where(core == j)
            top, bot = ys.min(), ys.max()
            yy = np.arange(band.shape[0])[:, None]
            reg = (near == j) & (dist <= 10) & (yy >= top - 4) & (yy <= bot + 3) & (al[y0:y1, x0:x1] > 0.05)
            cols = np.where(reg.any(0))[0]; rows = np.where(reg.any(1))[0]
            c0, c1, r0, r1 = cols.min(), cols.max() + 1, rows.min(), rows.max() + 1
            rgba = np.dstack([a[y0:y1, x0:x1], (al[y0:y1, x0:x1] * 255 * reg).astype(np.uint8)])[r0:r1, c0:c1]
            frames.append((c0 + x0, Image.fromarray(rgba, 'RGBA')))
        frames.sort(key=lambda t: t[0])
        res[name] = [f for _, f in frames]
    return res

if __name__ == '__main__':
    os.makedirs('frames', exist_ok=True)
    CELL, COLS = 224, 8
    order = [(n, nm) for n in (1, 2) for nm in ('turn', 'idle', 'wall', 'dive', 'wave')]
    allf = {n: cut(n) for n in (1, 2)}
    sheet = Image.new('RGBA', (CELL * COLS, CELL * len(order)), (0, 0, 0, 0))
    meta = {}
    for r, (n, nm) in enumerate(order):
        fr = allf[n][nm]
        meta[f'{"ab"[n-1]}_{nm}'] = {'y': r * CELL, 'frames': len(fr)}
        for c, im in enumerate(fr):
            im.save(f'frames/{"ab"[n-1]}_{nm}_{c+1}.png')
            w, h = im.size
            if w > CELL or h > CELL:
                s = min(CELL / w, CELL / h); im = im.resize((int(w * s), int(h * s)), Image.NEAREST); w, h = im.size
            sheet.paste(im, (c * CELL + (CELL - w) // 2, r * CELL + CELL - 8 - h), im)  # feet 8px above the cell floor
    sheet.save('../../art/keeper_p2.png')
    json.dump(meta, open('keeper_p2.meta.json', 'w'), indent=1)
    bg = Image.new('RGBA', sheet.size, (24, 30, 48, 255)); bg.alpha_composite(sheet)
    bg.convert('RGB').save('contact.png')
    print(json.dumps(meta))
