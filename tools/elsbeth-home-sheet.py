"""DEEP16 pipeline 2 (generated art): Elsbeth at home, the Halfway Inn's kitchen girl -> elsbethhome_p1, her figure in her home clothes.

    python tools/elsbeth-home-sheet.py     (writes deep16/art/elsbethhome_p1.png/.json)

Asked in art-wanted section 35, block 6 (11-04): "ELSBETH AT THE TUB -- the section 26 candle girl at home: a figure only". The art desk's
HALFWAY-INN-ELSBETH-TUB (K01 N Scrub 6, K02 N Idle 4, K03 S Idle 4, K04 S Walk 6) and -ELSBETH-SE-E-NE (K05 SE, K06 E, K07 NE Idle 4), sorted to
deep16/_src/elsbeth/INN-TUB-1104/ and INN-SE-E-NE-1104/. One band a page, numbered under the frames, a label at the left.

Cut here: idle in S SE E NE (SW W NW their mirrors) and walk in S. HELD: K01 and K02, the views from behind at the tub -- the art desk drew her
fused to an oversized tub on a stand, her hands on its rim, and asked the cutter to isolate her and use the inn's own one-square tub; her
auburn hair is the tub's wood at this palette, so no colour parts them (a hand mask a frame would). Her N idle plays the nearest drawn facing.

How a page is cut: tools/amara-sheet.py's way with one band -- the navy by the edges, the label left of the first frame, the band the tallest
run of figure rows (the numbers below fall out), its frames the columns joined where they overlap. One scale a page: its median height to TALL;
each frame on its lowest row, by its torso's middle. Boxed down, snapped to the 64 (red and fire left out), outlined.
"""
import importlib.util, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
SRC = os.path.join(pix.SRC, 'elsbeth')
NAME = 'elsbethhome_p1'
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
OUTL = np.array([int(P['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
TALL, FW, FH, AX, AY = 47, 48, 64, 24, 60          # (the art desk's "~46-49 px"; folkwoman_p1 stands 47)
AVOID = ['red', 'fire']
PAGES = {('idle', 0): 'INN-TUB-1104/K03-S-Idle.png', ('idle', 7): 'INN-SE-E-NE-1104/K05-SE-Idle.png', ('idle', 6): 'INN-SE-E-NE-1104/K06-E-Idle.png',
         ('idle', 5): 'INN-SE-E-NE-1104/K07-NE-Idle.png', ('walk', 0): 'INN-TUB-1104/K04-S-Walk.png'}
MIRROR = {1: 7, 2: 6, 3: 5}
ROWS = {'idle': (4, 4, [0, 1, 2, 3, 5, 6, 7]), 'walk': (6, 8, [0])}      # (frames, fps, the facings drawn)


def frames(path, n):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); H, W = a.shape[:2]
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < 30
    lab, k = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, k + 1))
    fg = ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 400]))
    flab, fn = ndimage.label(fg); boxes = ndimage.find_objects(flab)
    x_first = min(b[1].start for b in boxes if b and (b[0].stop - b[0].start) > H * 0.15)
    fig = np.isin(flab, [i + 1 for i, b in enumerate(boxes) if b and b[1].stop > x_first + 4])
    rows = fig.any(1); runs = []; y = 0
    while y < H:
        if rows[y]:
            y0 = y
            while y < H and rows[y]: y += 1
            runs.append((y0, y))
        y += 1
    y0, y1 = max(runs, key=lambda r: r[1] - r[0])
    band = fig[y0:y1]; cols = band.any(0); segs = []; x = 0
    while x < W:
        if cols[x]:
            x0 = x
            while x < W and cols[x]: x += 1
            if segs and x0 - segs[-1][1] < 10: segs[-1][1] = x
            else: segs.append([x0, x])
        x += 1
    segs = [s for s in segs if s[1] - s[0] > 6]
    if len(segs) != n:
        raise SystemExit('%s: %d frames, not %d' % (os.path.basename(path), len(segs), n))
    out = []
    for x0, x1 in segs:
        m = band[:, x0:x1]; ys, xs = np.where(m)
        sl = (slice(y0 + ys.min(), y0 + ys.max() + 1), slice(x0 + xs.min(), x0 + xs.max() + 1))
        out.append((a[sl].astype(np.uint8), fig[sl]))
    return out


def to1x(rgb8, mask, k):
    h, w = mask.shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb8.astype(np.float32) * mask[..., None]
    rgb = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for c in range(3)], -1)
    rgb = rgb / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8); s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(rgb, AVOID)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def place(o):
    al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
    top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
    cx = ndimage.center_of_mass(top)[1]
    cell = np.zeros((FH, FW, 4), np.uint8); dx, dy = int(round(AX - cx)), AY - ys[-1]
    h, w = o.shape[:2]; sy, sx = max(0, -dy), max(0, -dx)
    hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, FW - max(0, dx))
    cell[max(0, dy):max(0, dy) + hh, max(0, dx):max(0, dx) + ww] = o[sy:sy + hh, sx:sx + ww]
    return cell


def main():
    cells = {}
    for (row, f), fn in PAGES.items():
        n = ROWS[row][0]; fr = frames(os.path.join(SRC, fn), n)
        k = TALL / float(np.median([m.shape[0] for _, m in fr]))
        cells[(row, f)] = [place(to1x(r, m, k)) for r, m in fr]
    for m, s in MIRROR.items():
        if ('idle', s) in cells:
            cells[('idle', m)] = [np.ascontiguousarray(c[:, ::-1]) for c in cells[('idle', s)]]
    anims, y = {}, 0
    sheet = np.zeros((8 * FH * len(ROWS), FW * max(r[0] for r in ROWS.values()), 4), np.uint8)
    for row, (n, fps, drawn) in ROWS.items():
        for f in range(8):
            for i, c in enumerate(cells.get((row, f), [])):
                sheet[y + f * FH:y + (f + 1) * FH, i * FW:(i + 1) * FW] = c
        anims[row] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=n, fps=fps, drawn=drawn); y += 8 * FH
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    meta = dict(image='art/%s.png' % NAME, fw=FW, fh=FH, ax=AX, ay=AY, top=TALL, anims=anims, name='Elsbeth',
                hold=['K01 N Scrub 6 and K02 N Idle 4: drawn fused to an oversized tub on a stand (the art desk asked her isolated for the inn\'s one-square tub)'],
                source='drawn by the art desk (HALFWAY-INN-ELSBETH-TUB and -ELSBETH-SE-E-NE, 11-04: art-wanted section 35 block 6, the candle girl at home), '
                       'cut by tools/elsbeth-home-sheet.py; SW W NW mirrored; her views from behind at the tub held')
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, %s' % (NAME, sheet.shape[1], sheet.shape[0], {k: (v['frames'], v['drawn']) for k, v in anims.items()}))


main()
