"""DEEP16 pipeline 2 (generated art): the Game Show's two props from Griz's generated sheets -> gschest_p1 and gsbed_p1.

    python tools/gsprops-sheet.py            (both sheets; `check` also writes dev/visions/gsprops-check.png, the frames at 4x)

Sources (gitignored, deep16/_src/): "Pixel Art Treasure Chest Animation Sheet.png" and "Pixel Art Cot Comparison A and B.png" -- Griz,
2026-10-07, from the pastes in deep16-art-wanted.md "The Game Show's props: the chest and the bed" (PROPS, THE SUPPLY CHEST; PROPS, THE
CAMP COT). The Game Show lane §3 F.

The chest sheet is cut by its own row and number labels (tools/sheetrows.py; the boxes below read off the sheet); its numbers and row
names are lettering, dropped. Every frame is then registered on Shut 1 by the chest's body (the lower half, which does not move while the
lid does), so a row plays in place. The cot sheet is two drawings, A and B, each one blob; its two letters are lettering.

Sizes (the seat's, against the grid's 64 x 32 floor diamond, js/iso.js TW/TH): the chest mostly fills its diamond, about 46 px across
(K_CHEST); the cot lies along one axis of its square, one square long and some, about 47 px across (K_COT). Each frame is boxed down to
game size, snapped to deep16/palette.json and outlined, as the creatures' sheets are (tools/pixelate.py). (ax, ay) is the middle of the
square the prop stands on: the drawing's middle across, a quarter of its width up from its lowest point (the footprint's front corner).

A prop sheet is not a creature's: no facings. Its json is the wheel's shape (tools/wheel-sheet.py): `image`, the cell `fw` x `fh`, the
anchor `ax`, `ay`, and `anims` {row: {row, frames, fps}} -- a row a strip of cells left to right. js/circles.js draws them.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))


def src(name):
    """the source in this checkout's _src, or the main checkout's from a worktree (the sources are gitignored)"""
    p = os.path.join(ROOT, 'deep16', '_src', name)
    if not os.path.exists(p) and os.sep + '.claude' + os.sep + 'worktrees' + os.sep in p:
        p = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', name)
    return p


NUM = lambda k: [str(i + 1) for i in range(k)]
CHEST = dict(file='Pixel Art Treasure Chest Animation Sheet.png',
             # the row names down the left, and each row's numbers (a strip under its frames: a blob wholly inside is lettering)
             text=[(0, 0, 225, 1086), (225, 200, 1448, 240), (225, 466, 1448, 502), (225, 738, 1448, 776), (225, 1020, 1448, 1058)],
             rows=[('shut', (225, 10, 1448, 240), (221, 240), NUM(1)),
                   ('thump', (225, 250, 1448, 502), (466, 502), NUM(3)),
                   ('open', (225, 505, 1448, 776), (738, 776), NUM(4)),
                   ('opened', (225, 780, 1448, 1058), (1020, 1058), NUM(2))])
COT = dict(file='Pixel Art Cot Comparison A and B.png', text=[(90, 640, 150, 710), (1300, 640, 1365, 710)])
FPS = {'shut': 1, 'thump': 8, 'open': 10, 'opened': 5, 'a': 1, 'b': 1}
K_CHEST = 246 / 46.0       # Shut 1 is 246 px across on the sheet
K_COT = 637 / 47.0         # each cot 637 across


def register(ref, im, search=64):
    """the (dx, dy) that lays frame `im` on `ref` by the chest's body: the silhouettes (each its biggest blob: no dust, sparkles or
    motion lines) compared over the lower 40% of ref's, where the box stands still while the lid moves -- the fewest pixels that differ"""
    from scipy import ndimage
    def body(a):
        m = a[..., 3] > 0
        lab, n = ndimage.label(m, structure=np.ones((3, 3)))
        return lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    R, I = body(ref), body(im)
    P = search + 2
    H, W = max(R.shape[0], I.shape[0]) + 2 * P, max(R.shape[1], I.shape[1]) + 2 * P
    Rc = np.zeros((H, W), bool); Rc[P:P + R.shape[0], P:P + R.shape[1]] = R
    Ic = np.zeros((H, W), bool); Ic[P:P + I.shape[0], P:P + I.shape[1]] = I
    ys = np.where(R.any(1))[0]
    y0, y1 = P + int(ys[0] + 0.6 * (ys[-1] - ys[0])), P + ys[-1] + 1 + 8      # the band: the box's lower part and a little below its foot
    Rb = Rc[y0:y1]
    def miss(dx, dy):
        return (np.roll(np.roll(Ic, dy, 0), dx, 1)[y0:y1] ^ Rb).sum()
    best = min((miss(dx, dy), dx, dy) for dy in range(-search, search + 1, 2) for dx in range(-search, search + 1, 2))
    best = min((miss(dx, dy), dx, dy) for dy in range(best[2] - 1, best[2] + 2) for dx in range(best[1] - 1, best[1] + 2))
    return best[1], best[2]


def game(a_rgba, k):
    """a sheet-size RGBA array -> game size, palette-snapped and outlined"""
    im = Image.fromarray(a_rgba, 'RGBA')
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False)


def lay(frames, k, pad=3):
    """frames: [(name, sheet-size RGBA array, (x, y) of its top left in one shared space)] -> the game-size frames on one cell size,
    each where its offset puts it, and the anchor (from the first frame: its middle across, a quarter of its width up from its foot)"""
    smalls = []
    for nm, a, (x, y) in frames:
        g = game(a, k)
        smalls.append((nm, g, (round(x / k), round(y / k))))
    x0 = min(o[0] for _, _, o in smalls); y0 = min(o[1] for _, _, o in smalls)
    x1 = max(o[0] + g.shape[1] for _, g, o in smalls); y1 = max(o[1] + g.shape[0] for _, g, o in smalls)
    fw, fh = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    cells = []
    for nm, g, (x, y) in smalls:
        c = np.zeros((fh, fw, 4), np.uint8)
        cx, cy = x - x0 + pad, y - y0 + pad
        c[cy:cy + g.shape[0], cx:cx + g.shape[1]] = g
        cells.append((nm, c))
    first = cells[0][1][..., 3] > 0
    ys, xs = np.where(first)
    width = xs.max() - xs.min() + 1
    ax, ay = int(round((xs.min() + xs.max()) / 2)), int(round(ys.max() - width / 4))
    return cells, fw, fh, ax, ay


def write(name, rows, fw, fh, ax, ay, note, source):
    cols = max(len(r) for _, r in rows)
    sheet = np.zeros((fh * len(rows), fw * cols, 4), np.uint8)
    anims = {}
    for j, (row, cells) in enumerate(rows):
        for i, c in enumerate(cells):
            sheet[j * fh:(j + 1) * fh, i * fw:(i + 1) * fw] = c
        anims[row] = {'row': j, 'frames': len(cells), 'fps': FPS[row]}
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, name + '.png'), optimize=True)
    meta = {'_note': note, 'image': 'art/' + name + '.png', 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'cols': cols, 'prop': True,
            'anims': anims, 'source': source}
    json.dump(meta, open(os.path.join(pix.ART, name + '.json'), 'w', encoding='utf-8'), indent=1)
    print(name, '%dx%d a frame,' % (fw, fh), ', '.join('%s %d' % (r, len(c)) for r, c in rows), '; anchor', (ax, ay))
    return sheet


def chest():
    cut = SR.cut_sheet(src(CHEST['file']), CHEST, tag='chest')
    full = lambda im: np.asarray(im.convert('RGBA'))
    ref_nm, ref_im, ref_box = cut['shut'][0]
    ref = full(ref_im)
    frames = []
    for row in ('shut', 'thump', 'open', 'opened'):
        for nm, im, box in cut[row]:
            a = full(im)
            dx, dy = (0, 0) if row == 'shut' else register(ref, a)
            frames.append((row + nm, a, (dx, dy)))
            if row != 'shut':
                print('  chest %s %s on Shut 1 by (%d, %d)' % (row, nm, dx, dy))
    cells, fw, fh, ax, ay = lay(frames, K_CHEST)
    by = {}
    for nm, c in cells:
        by.setdefault(nm.rstrip('0123456789'), []).append(c)
    rows = [(r, by[r]) for r in ('shut', 'thump', 'open', 'opened')]
    note = ('the Game Show\'s supply chest (tools/gsprops-sheet.py): shut, still; thump, something landing in it from above (the jolt, '
            'the lid a crack open in gold light, shut with a puff of dust); open, the lid from shut to wide open; opened, wide open and '
            'glowing, two frames flickering. Its front faces the lower left. (ax, ay) is the middle of the square it stands on.')
    return write('gschest_p1', rows, fw, fh, ax, ay, note, 'generated by Griz (2026-10-07, one sheet from the paste in deep16-art-wanted.md), cut by tools/gsprops-sheet.py')


def cot():
    from scipy import ndimage
    a = np.asarray(Image.open(src(COT['file'])).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    SR.drop_text(m, COT['text'])
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    big = sorted(1 + np.argsort(sz)[-2:], key=lambda i: ndimage.find_objects(lab == i)[0][1].start)   # A on the left, B on the right
    rows = []
    for row, i in zip(('a', 'b'), big):
        im, box = SR.rgba_crop(a, lab == i)
        cells, fw, fh, ax, ay = lay([(row, np.asarray(im), (0, 0))], K_COT)
        rows.append((row, cells, fw, fh, ax, ay))
    ax, ay = max(r[4] for r in rows), max(r[5] for r in rows)          # one cell size, both drawings on one anchor
    fw, fh = max(ax + r[2] - r[4] for r in rows), max(ay + r[3] - r[5] for r in rows)
    out = []
    for row, cells, w, h, x, y in rows:
        c = np.zeros((fh, fw, 4), np.uint8)
        c[ay - y:ay - y + h, ax - x:ax - x + w] = cells[0][1]
        out.append((row, [c]))
    note =('the Game Show\'s camp cot (tools/gsprops-sheet.py): a, lying along the floor\'s diagonal from the upper left to the lower '
            'right (the grid\'s x axis), the pillow at the upper left; b, along the other (the grid\'s y axis), the pillow at the upper '
            'right. (ax, ay) is the middle of the square it lies on.')
    return write('gsbed_p1', out, fw, fh, ax, ay, note,
                 'generated by Griz (2026-10-07, one sheet from the paste in deep16-art-wanted.md), cut by tools/gsprops-sheet.py')


def main():
    sheets = [chest(), cot()]
    if 'check' in sys.argv[1:]:
        h = sum(s.shape[0] for s in sheets) + 8
        w = max(s.shape[1] for s in sheets)
        canvas = Image.new('RGBA', (w, h), (40, 44, 60, 255))
        y = 0
        for s in sheets:
            canvas.alpha_composite(Image.fromarray(s, 'RGBA'), (0, y)); y += s.shape[0] + 8
        out = os.path.join(ROOT, 'dev', 'visions', 'gsprops-check.png')
        canvas.resize((w * 4, h * 4), Image.NEAREST).save(out)
        print('check:', out)


if __name__ == '__main__':
    main()
