"""DEEP16 pipeline 2 (generated art): Griz's generated character sheet for Rascal -> a palette sprite sheet, rascal_p1.

    python tools/rascal-sheet.py [raw=1]

Source: deep16/_src/rascal_grok_1.jpg (Griz, 2026-10-06, from the paste in deep16-art-wanted.md "RASCAL, SHEET 1"; his word on it: "got the face
wrong and ran two of his mouth whiskers through his hat, but the lobsta tail is cool", "the sheet poses match the others better"). A portrait, a
turnaround of four, and eight labelled rows facing LEFT (his claw is his right arm, so facing left it is nearest the viewer): Walk, Pinch, Social
Sharing, Social Flame, Climb, Flinch, Fall, Prone. The generator laid seven columns a row and numbered them its own way, so the frames are cut by
boxes read off the sheet (dev/visions/Rascal/RascalSheet1.jpg), the way tools/denny-sheet.py cuts Denny's.

The same pass as Denny's: each figure cut from the navy background, boxed down to game size, snapped to deep16/palette.json and outlined. The rows
face left, so facings SW, W and NW take them as drawn and NE, E and SE mirrored; S and N take the front and back views (the walk bobs them). The
two orange whiskers the generator ran up through his hat are erased above the hat's top in every standing frame (`raw=1` keeps them).
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

OPT = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
SRC = os.path.join(ROOT, 'deep16', '_src', 'rascal_grok_1.jpg')
BG = np.array([0, 11, 29])
TARGET_H = 60              # the front view, hat and whiskers and all: his body then stands about Denny's 52
ROW_H = 55                 # the rows' standing frames, smaller on the sheet (shorter whiskers), the same body
FW, FH, AX, AY = 112, 96, 56, 84

VIEWS = {'front': (369, 11, 519, 165), 'right': (559, 12, 732, 164), 'back': (780, 12, 909, 169), 'left': (946, 12, 1120, 164)}
COLS = [(226, 346), (360, 484), (490, 608), (616, 737), (740, 860), (870, 992), (1006, 1122)]
ROWS = {'walk': (238, 320), 'pinch': (330, 402), 'sharing': (404, 470), 'flame': (470, 541), 'climb': (544, 612), 'flinch': (612, 670), 'fall': (666, 726), 'prone': (722, 784)}
# which columns each engine row takes, in order (the sheet's own numbering is not to be trusted: the walk's read 1 2 3 4 5 6 8)
TAKE = {'walk': [0, 1, 2, 3, 4, 5, 6], 'pinch': [0, 1, 2, 3, 4, 5], 'sharing': [0, 1, 2, 3, 4, 5], 'flame': [0, 1, 2, 3, 4, 5, 6],
        'climb': [0, 1, 2, 3, 4, 5], 'flinch': [0, 1, 2, 3], 'fall': [0, 1, 2, 3], 'prone': [0, 1, 2, 3, 4, 5, 6]}
LYING = ('fall', 'prone')

sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)


def cut(box, pad=4):
    x0, y0, x1, y1 = box
    c = sheet[y0 - pad:y1 + pad, x0 - pad:x1 + pad]
    m = np.abs(c - BG).sum(-1) > 60
    m = ndimage.binary_fill_holes(ndimage.binary_opening(m, iterations=1))
    lab, n = ndimage.label(m)                     # keep the figure, drop the frame's number and stray specks
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(m)
    c, m = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    rgba = np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def unwhisker(img):
    """the two whiskers the generator ran up through the hat: the thin things standing above the hat's top go (a raised claw stays -- it is a
    blob, not a line). The hat: the biggest dark blob in the top half of the figure; the claw's black band can be that in a climbing frame, so
    only thin pieces are taken whichever blob is found."""
    a = np.array(img); h = a.shape[0]
    dark = (a[..., :3].max(-1) < 70) & (a[..., 3] > 0)
    dark[h // 2:] = False
    lab, n = ndimage.label(dark)
    if not n:
        return img
    sizes = ndimage.sum(dark, lab, range(1, n + 1)); hat = lab == (1 + int(np.argmax(sizes)))
    top = int(np.where(hat.any(axis=1))[0][0])
    if top <= 0:
        return img
    above = a[:top, :, 3] > 0
    lab2, n2 = ndimage.label(above)
    for i, sl in enumerate(ndimage.find_objects(lab2)):
        piece = lab2[sl] == i + 1
        bw, bh = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        thick = piece.sum() / max(1, bw + bh)          # (a line's area over its box's reach: thin for a wire, fat for a claw)
        if thick < 4.0:
            a[:top][sl][piece, 3] = 0
    return Image.fromarray(a, 'RGBA')


def game_size(img, scale):
    w, h = img.size
    return img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)


def body_x(a, head_band=(0.15, 0.5)):
    """x of the body's middle (the head band, the steadiest thing in a walk): rows in the band, mean of opaque columns."""
    h = a.shape[0]
    band = a[int(h * head_band[0]):int(h * head_band[1]), :, 3] > 0
    ys, xs = np.where(band)
    return float(xs.mean()) if len(xs) else a.shape[1] / 2


def feet_x(a):
    rows = np.where(a[..., 3].any(axis=1))[0]
    band = a[rows[-1] - 4:rows[-1] + 1, :, 3] > 0
    return float(np.where(band)[1].mean())


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
    RAW = OPT.get('raw') == '1'
    fix = (lambda im: im) if RAW else unwhisker
    vscale = (VIEWS['front'][3] - VIEWS['front'][1]) / TARGET_H
    views = {k: pix.pixelate(game_size(fix(cut(box)), vscale), 1, do_lift=False) for k, box in VIEWS.items()}
    idle = {k: place(v, feet_x(v)) for k, v in views.items()}
    # the rows, all at one scale (the sheet drew them alike): the walk's mean height against ROW_H
    rowcuts = {}
    for name, (y0, y1) in ROWS.items():
        rowcuts[name] = [cut((COLS[c][0], y0, COLS[c][1], y1)) for c in TAKE[name]]
    wscale = np.mean([im.size[1] for im in rowcuts['walk']]) / ROW_H
    left_off = None
    rows = {}
    for name, ims in rowcuts.items():
        out = []
        for im in ims:
            if name not in LYING:
                im = fix(im)
            a = pix.pixelate(game_size(im, wscale), 1, do_lift=False)
            if left_off is None:
                left_off = body_x(a) - feet_x(a)        # (the walk's first frame: where the head sits over the feet, kept for every row)
            out.append(place(a, body_x(a) - left_off) if name not in LYING else place(a, a.shape[1] / 2))
        rows[name] = out
    mirror = lambda fr: fr[:, ::-1].copy()
    # facings S, SW, W, NW, N, NE, E, SE: the rows face left
    frames = {'idle': [], 'walk': []}
    for f in range(8):
        base = idle['front' if f == 0 else 'back' if f == 4 else 'left' if f in (1, 2, 3) else 'right']
        frames['idle'].append([base, base, breathe(base), breathe(base)])
        if f == 0:
            frames['walk'].append([np.roll(idle['front'], -(i % 2), axis=0) for i in range(len(rows['walk']))])
        elif f == 4:
            frames['walk'].append([np.roll(idle['back'], -(i % 2), axis=0) for i in range(len(rows['walk']))])
        elif f in (1, 2, 3):
            frames['walk'].append(rows['walk'])
        else:
            frames['walk'].append([mirror(fr) for fr in rows['walk']])
    # the rest: the side frames for every facing (a stand-in's front and back), mirrored for the east
    lying = rows['prone']
    seqs = {'attack': rows['pinch'], 'socialsharing': rows['sharing'], 'socialflame': rows['flame'], 'climb': rows['climb'], 'flinch': rows['flinch'],
            'hurt': rows['fall'] + [lying[1], lying[2]],         # knocked out: over backwards, then lying -- the last frame lies on the ground
            'prone': [rows['fall'][1], lying[0]]}                 # knocked flat and alive: going over, then lying; up again by the row played backwards
    for name, seq in seqs.items():
        frames[name] = [[mirror(fr) for fr in seq] if f in (5, 6, 7) else seq for f in range(8)]
    pix.write_sheet('rascal_p1', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'rascal_p1.json')
    meta = json.load(open(meta_p)); meta['anims']['idle']['fps'] = 2
    meta['source'] = 'generated by Griz (2026-10-06), cleaned by tools/rascal-sheet.py' + (' (raw: the whiskers through the hat kept)' if RAW else '')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('rascal_p1:', ', '.join('%s %d' % (k, len(v[0])) for k, v in frames.items()))


if __name__ == '__main__':
    main()
