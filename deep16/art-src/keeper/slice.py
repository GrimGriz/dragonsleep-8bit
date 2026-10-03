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
    import glob
    os.makedirs('frames', exist_ok=True)
    allf = {n: cut(n) for n in (1, 2)}
    for n in (1, 2):
        for nm, fr in allf[n].items():
            for c, im in enumerate(fr): im.save(f'frames/{"ab"[n-1]}_{nm}_{c+1}.png')
    # ---- keeper_p2: the sheet the engine reads (js/sprites.js: rows are anim x facing, 8 facings S SW W NW N NE E SE, the columns the frames).
    # Grok drew one side view (facing right), so the east-ish facings (S, NE, E, SE) are as drawn and the west-ish (SW, W, NW, N) mirrored.
    CW, CH, FEET = 168, 124, 4
    src = {f'{"ab"[n-1]}_{nm}': allf[n][nm] for n in (1, 2) for nm in ('idle', 'wall', 'dive', 'wave')}
    # composed rows: the Slam's dive from both sheets (a = the first sheet's, b = the second's), and the sinking
    rows = dict(src)
    rows['slam_ab'] = src['a_dive'][:3] + src['b_dive'][2:7]     # launch from the first sheet's dive, smash and return from the second's (Griz: neither is canon)
    rows['slam_ba'] = src['b_dive'][:2] + src['a_dive'][2:7]     # the other way about
    rows['hurt_b'] = src['b_dive'][:2]                           # a crouch from the hit
    rows['die_b'] = src['b_dive'][2:5]                           # it sinks: the splash, the burst, the pool closing over
    order = ['a_idle', 'a_wall', 'a_dive', 'a_wave', 'b_idle', 'b_wall', 'b_dive', 'b_wave', 'slam_ab', 'slam_ba', 'hurt_b', 'die_b']
    FACES = [False, True, True, True, True, False, False, False]   # mirrored? S SW W NW N NE E SE
    sheet = Image.new('RGBA', (CW * 8, CH * 8 * len(order)), (0, 0, 0, 0))
    meta = {}
    for r, nm in enumerate(order):
        fr = rows[nm]; y0 = r * CH * 8; meta[nm] = {'y': y0, 'frames': len(fr)}
        for f, mir in enumerate(FACES):
            for c, im in enumerate(fr):
                w, h = im.size
                if mir: im = im.transpose(Image.FLIP_LEFT_RIGHT)
                sheet.paste(im, (c * CW + (CW - w) // 2, y0 + f * CH + CH - FEET - h), im)
    sheet.save('../../art/keeper_p2.png')
    base = {'fw': CW, 'fh': CH, 'ax': CW // 2, 'ay': CH - FEET}
    an = {k: dict(base, y=v['y'], frames=v['frames'], fps=6 if k.endswith('idle') else 10) for k, v in meta.items()}
    def alias(name, row, fps=None): an[name] = dict(an[row], **({'fps': fps} if fps else {}))
    # the engine's own anim names, pointing at a row: D16.keeper.pose() re-points them from D16.keeper.CFG (js/keeper.js) -- these are the defaults
    alias('idle', 'a_idle'); alias('walk', 'a_idle'); alias('attack', 'slam_ab'); alias('wave', 'b_wave'); alias('wall', 'a_wall')
    alias('hurt', 'hurt_b', 8); alias('die', 'die_b', 6); alias('cast', 'b_wave')
    json.dump({'image': 'art/keeper_p2.png', 'fw': CW, 'fh': CH, 'ax': base['ax'], 'ay': base['ay'], 'top': 118, 'anims': an}, open('../../art/keeper_p2.json', 'w'), indent=1)
    json.dump(meta, open('keeper_p2.meta.json', 'w'), indent=1)
    cs = Image.new('RGBA', (CW * 8, CH * len(order)), (24, 30, 48, 255))   # the contact sheet: the facing S row of each anim
    for r, nm in enumerate(order): cs.alpha_composite(sheet.crop((0, meta[nm]['y'], CW * 8, meta[nm]['y'] + CH)), (0, r * CH))
    cs.convert('RGB').save('contact.png')
    print(json.dumps(meta))
