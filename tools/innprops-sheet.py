"""DEEP16 pipeline 2 (generated art): the Halfway Inn's props -- the art desk's return of art-wanted section 36 (2026-11-04, nine pages) ->
deep16/art/innprops_p1.png/.json, an atlas of named pieces (the `tiles` shape js/topview.js TV.piece reads: 'x,y,w,h,ax,ay' a box).

    python -I tools/innprops-sheet.py          (`check` also writes dev/visions/innprops-check.png: each piece at 2x on its footprint's diamonds)

Sources (untracked, the shared checkout's deep16/_src/): halfway-inn/ART-36-PAGES-01-09/ -- the bundle HALFWAY-INN-PAGES-01-09.zip unzipped, each page's
CUTTER-NOTES.md beside it; the ask was deep16/_src/art-desk/sent/ASK-2026-11-04-halfway-inn-props.md. The props cutter seat (11-04, started by the lanes desk on
Griz's "cutter is delaying on the props, start up a separate cutter for those").

The pages are drawn in the grid's own 2:1 projection (a table's long top edge rises 0.47 a px across, its short edge 0.6), each prop on a transparent cell. A piece:
  - is every blob of the page inside its box (`box`, read off a probe of the page), mirrored left for right first where the floor wants the other axis (`mirror`:
    a thing drawn along the grid's x stands along its y);
  - is fitted to its footprint by its ground corners at 1x: `foot` (a, b) squares along the grid's x and y, the drawing's width across = 32 (a + b) px (the left and
    right corners of a box stand straight over its footprint's left and right corners), or a scale of its own (`k`, source px a game px) where the drawing runs past
    its footprint (the long table's benches);
  - its anchor (ax, ay) the footprint's BACK corner on the ground -- the corner at (gx0, gy0), top of the diamond -- found from the drawing's middle across and its
    lowest point (the footprint's front corner), nudged by `dx`, `dy` where the feet stand in from the corners; js/innprops.js lays it there and cuts it a square at
    a time for the sort;
  - is boxed down, snapped to deep16/palette.json and outlined (tools/gsprops-sheet.py game(), tools/pixelate.py).
The fires: each hearth is drawn dark in its mouth; its flame frames (the page's strips) are laid in that mouth -- sheared so the logs lie along the mouth's floor,
centred on it, and cut to the mouth's dark (the notes' "fit and clip each overlay to its own sloped firebox") -- each frame a box of `inn_flameC` / `inn_flameS`
with the hearth's own anchor, so it lays over the hearth exactly.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
GS = _load('gsprops', os.path.join(ROOT, 'tools', 'gsprops-sheet.py'))
pix = GS.pix
SRC = os.path.join(pix.SRC, 'halfway-inn', 'ART-36-PAGES-01-09')
PAGE = {'P01': 'halfway-handoff/P01-HEARTHS-SOURCE.png', 'P02': 'halfway-handoff/P02-COMMON-ROOM-SOURCE.png', 'P03': 'halfway-p03/P03-KITCHEN-SOURCE.png',
        'P04': 'halfway-p04/P04-ROOMS-SOURCE.png', 'P05': 'halfway-p05/P05-BARN-SOURCE.png', 'P06': 'halfway-p06/P06-YARD-AND-SHORE-SOURCE.png',
        'P09A': 'halfway-p09/P09A-SUPPER-AND-LIGHTING.png'}
HW, HH = 32, 16

# name: page, box (x0, y0, x1, y1 on the page), foot (a along x, b along y, the floor's), and the fit's own words
PIECES = {
    # PAGE 1 -- the big fire, view A (its long mouth to the lower right: the grid's +x face, the kitchen's -- the one face the fixed camera sees); the small one, A
    'inn_hearth':   dict(page='P01', box=(95, 0, 510, 440), foot=(2, 4), dy=-2),
    'inn_hearthS':  dict(page='P01', box=(1208, 250, 1380, 440), foot=(1, 1), dy=-2),
    # PAGE 2 -- the common room
    # (the furniture drawn about twice a figure's scale for its squares -- a one-square table as tall as the town figure: fitted instead by its height at the props'
    # 8 px a foot (RULED 10-14), `h` px whole, and stood in the middle of its squares; the long table half its drawn length, laid twice end to end on its six)
    'inn_longtable': dict(page='P02', box=(115, 40, 715, 435), foot=(3, 1), cut=(3, 2), h=76, dy=3),  # (a half: the table on its row, its benches over the open side's)
    'inn_settle':   dict(page='P02', box=(885, 150, 1155, 420), foot=(1, 2), h=44, mirror=True),      # (drawn along x facing +y; mirrored it stands along y facing the fire, +x)
    'inn_table2':   dict(page='P02', box=(1298, 208, 1500, 405), foot=(1, 1), h=30),
    'inn_chairA':   dict(page='P02', box=(52, 592, 190, 802), foot=(1, 1), h=30),                     # (facing +x)
    'inn_chairB':   dict(page='P02', box=(210, 618, 348, 805), foot=(1, 1), h=30),                    # (facing +y)
}
HELD = {'inn_counter': 'P02 lower centre: drawn near frontal (its top 0.13 a px across, not the grid\'s 0.5) and its rail on the customers\' side, which on the floor is '
                       'the side away from the camera -- held (the code\'s counter stands)',
        'inn_stair': 'P02 lower right: rises toward the screen\'s upper right (along the grid\'s y), the floor\'s runs east along x from its foot at (20,23) -- held, '
                     'as the page\'s notes warned (the code\'s floor stands)'}
FLAMES = {  # the flame strips: page, the band of rows the frames lie in, how many, onto which hearth
    'inn_flameC': dict(page='P01', band=(455, 560), n=6, x0=100, hearth='inn_hearth'),
    'inn_flameS': dict(page='P01', band=(700, 785), n=4, x0=100, hearth='inn_hearthS'),
}


def page(p):
    return np.array(Image.open(os.path.join(SRC, PAGE[p])).convert('RGBA'))


def blobs_in(a, box):
    """the page's drawings whose middles fall in the box, alone on a cell of the box's size (the rest of the page cleared)"""
    x0, y0, x1, y1 = box
    m = ndimage.binary_closing(a[..., 3] > 100, iterations=2)
    lab, n = ndimage.label(m)
    keep = np.zeros(lab.shape, bool)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        if x0 <= cx < x1 and y0 <= cy < y1 and (lab[sl] == i + 1).sum() > 60: keep |= lab == i + 1
    keep = ndimage.binary_dilation(keep, iterations=3)
    out = a.copy(); out[~keep] = 0
    return out[y0:y1, x0:x1]


def trim(g):
    ys, xs = np.where(g[..., 3] > 0)
    return g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def fit(name, spec, a):
    src = blobs_in(a, spec['box'])
    if spec.get('mirror'): src = src[:, ::-1].copy()
    src = trim(src)
    fa, fb = spec['foot']
    k = spec.get('k') or (src.shape[0] / float(spec['h']) if spec.get('h') else src.shape[1] / (32.0 * (fa + fb)))
    g = trim(GS.game(src, k))
    ys, xs = np.where(g[..., 3] > 0)
    cx, yb, w = (xs.min() + xs.max() + 1) / 2.0, ys.max() + 1, xs.max() - xs.min() + 1
    # the drawing's own ground diamond: its middle across, its front corner the lowest point, so its middle w/4 above that; stood on the footprint's middle, whose back
    # corner is 16 (a - b) left of it and 8 (a + b) above (a drawing fitted to its footprint's width lands corner on corner)
    ax = cx - 16 * (fa - fb) + spec.get('dx', 0)
    ay = yb - w / 4.0 - 8 * (fa + fb) + spec.get('dy', 0)
    return dict(g=g, ax=int(round(ax)), ay=int(round(ay)), k=k, foot=list(spec.get('cut', (fa, fb))))


def lowline(mask):
    """per column of a mask: its lowest row (None where empty), and a straight line through them"""
    cols = [(x, np.where(mask[:, x])[0].max()) for x in range(mask.shape[1]) if mask[:, x].any()]
    xs = np.array([c[0] for c in cols], float); ys = np.array([c[1] for c in cols], float)
    s, c = np.polyfit(xs, ys, 1)
    return s, c, xs.min(), xs.max()


def flames(name, spec, a, hearth):
    """the strip's frames laid in the hearth's mouth: one transform for all (from frame 1), so the logs lie still and only the flame moves"""
    y0, y1 = spec['band']
    band = a[y0:y1].copy()
    m = band[..., 3] > 100
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2))
    sls = sorted([sl for i, sl in enumerate(ndimage.find_objects(lab)) if (lab[sl] == i + 1).sum() > 400], key=lambda sl: sl[1].start)[:spec['n']]
    h = hearth['g']; lum = h[..., :3].astype(int).sum(-1) / 3
    dark = (h[..., 3] > 0) & (lum < 38)
    lab2, n2 = ndimage.label(dark)
    sizes = ndimage.sum(dark, lab2, range(1, n2 + 1))
    mouth = lab2 == (int(np.argmax(sizes)) + 1)
    ms, mc, mx0, mx1 = lowline(mouth)
    frames, shear, place = [], None, None
    for sl in sls:
        f = band[:, sl[1].start - 4:sl[1].stop + 4].copy()
        f = trim(f)
        g = GS.game(f, hearth['k'])
        if shear is None:
            fs, fc, fx0, fx1 = lowline(g[..., 3] > 0)
            shear = ms - fs                               # (the logs' baseline turned to the mouth's floor)
        W2 = g.shape[1]; out = np.zeros((g.shape[0] + int(abs(shear) * W2) + 6, W2, 4), np.uint8); off = int(abs(shear) * W2 / 2) + 3
        for x in range(W2):
            dy = int(round(shear * (x - W2 / 2.0)))
            out[off + dy:off + dy + g.shape[0], x] = g[:, x]
        frames.append(out)
    # place frame 1's lowest middle on the mouth's floor at its middle, two px up (the logs on the hearthstone)
    f0 = frames[0]; ys, xs = np.where(f0[..., 3] > 0)
    fcx = (xs.min() + xs.max()) / 2.0
    fby = max(np.where(f0[:, int(fcx)][:, 3] > 0)[0].max() if f0[:, int(fcx)][:, 3].any() else ys.max(), 0)
    mcx = (mx0 + mx1) / 2.0; mby = ms * mcx + mc
    ox, oy = int(round(mcx - fcx)), int(round(mby - fby - 2))
    grow = ndimage.binary_dilation(mouth, iterations=1)
    outs = []
    for f in frames:
        cv = np.zeros_like(h)
        for yy in range(f.shape[0]):
            ty = yy + oy
            if ty < 0 or ty >= h.shape[0]: continue
            for xx in range(f.shape[1]):
                tx = xx + ox
                if 0 <= tx < h.shape[1] and f[yy, xx, 3] and grow[ty, tx]: cv[ty, tx] = f[yy, xx]
        outs.append(cv)
    # one box for every frame: the union of what they cover, with the hearth's own anchor
    any_ = np.zeros(h.shape[:2], bool)
    for c in outs: any_ |= c[..., 3] > 0
    ys, xs = np.where(any_)
    by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return [dict(g=c[by0:by1, bx0:bx1], ax=hearth['ax'] - int(bx0), ay=hearth['ay'] - int(by0), foot=hearth['foot']) for c in outs]


def pack(items, width=512):
    """shelf packing: [(name, piece)] -> sheet, boxes by name"""
    x = y = rowh = 0; places = []
    for nm, p in items:
        h, w = p['g'].shape[:2]
        if x + w > width: x, y, rowh = 0, y + rowh + 1, 0
        places.append((nm, p, x, y)); x += w + 1; rowh = max(rowh, h)
    H = y + rowh
    sheet = np.zeros((H, width, 4), np.uint8); tiles = {}
    for nm, p, px, py in places:
        h, w = p['g'].shape[:2]
        sheet[py:py + h, px:px + w] = p['g']
        tiles.setdefault(nm, []).append('%d,%d,%d,%d,%d,%d' % (px, py, w, h, p['ax'], p['ay']))
    return sheet, {k: ' '.join(v) for k, v in tiles.items()}


def check(items):
    """each piece at 2x on its footprint's diamonds, on the floor's grey: the anchor and the fit at a glance"""
    from PIL import ImageDraw
    cells = []
    for nm, p in items:
        g = p['g']; fa, fb = p['foot']
        W = max(g.shape[1], 32 * (fa + fb)) + 40; H = g.shape[0] + 40
        im = Image.new('RGBA', (W, H), (92, 88, 84, 255)); d = ImageDraw.Draw(im)
        ox, oy = 20 + p['ax'], 20 + p['ay']
        for i in range(fa):
            for j in range(fb):
                tx, ty = ox + (i - j) * HW, oy + (i + j) * HH
                d.polygon([(tx, ty), (tx + HW, ty + HH), (tx, ty + 2 * HH), (tx - HW, ty + HH)], outline=(230, 220, 120, 255))
        im.alpha_composite(Image.fromarray(g, 'RGBA'), (20, 20))
        d.line([(ox - 3, oy), (ox + 3, oy)], fill=(255, 60, 60, 255)); d.text((4, 2), nm, fill=(255, 255, 255, 255))
        cells.append(im.resize((im.width * 2, im.height * 2), Image.NEAREST))
    W = 1600; x = y = rowh = 0; pos = []
    for c in cells:
        if x + c.width > W: x, y, rowh = 0, y + rowh + 6, 0
        pos.append((x, y)); x += c.width + 6; rowh = max(rowh, c.height)
    out = Image.new('RGBA', (W, y + rowh), (30, 30, 30, 255))
    for c, (px, py) in zip(cells, pos): out.alpha_composite(c, (px, py))
    os.makedirs(os.path.join(ROOT, 'dev', 'visions'), exist_ok=True)
    out.save(os.path.join(ROOT, 'dev', 'visions', 'innprops-check.png'))


def main():
    pages = {}
    got = {}
    for nm, spec in PIECES.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        got[nm] = fit(nm, spec, pages[spec['page']])
    items = [(nm, got[nm]) for nm in PIECES]
    for nm, spec in FLAMES.items():
        for f in flames(nm, spec, pages[spec['page']], got[spec['hearth']]): items.append((nm, f))
    sheet, tiles = pack(items)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, 'innprops_p1.png'), optimize=True)
    meta = {'_note': 'the Halfway Inn\'s props (tools/innprops-sheet.py, the art desk\'s return of art-wanted section 36, 2026-11-04): each piece a box x,y,w,h and its anchor '
                     'ax,ay -- the back corner of its footprint on the ground; `foot` its squares along the grid\'s x and y; the flames each a frame over its hearth, the '
                     'hearth\'s own anchor. js/innprops.js lays them on the inn\'s floor and cuts each a square at a time for the sort.',
            'image': 'art/innprops_p1.png', 'fw': 64, 'fh': 64, 'ax': 32, 'ay': 48, 'prop': True, 'anims': {},
            'foot': {nm: got[nm]['foot'] for nm in PIECES}, 'fps': {'inn_flameC': 8, 'inn_flameS': 8}, 'tiles': tiles,
            'source': 'generated by the art desk (2026-11-04, ART-36 pages 1-2: deep16/_src/halfway-inn/ART-36-PAGES-01-09), cut by tools/innprops-sheet.py'}
    with open(os.path.join(pix.ART, 'innprops_p1.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, indent=1)
    print('innprops_p1:', sheet.shape[1], 'x', sheet.shape[0], '|', ', '.join('%s %dx%d k%.2f' % (nm, got[nm]['g'].shape[1], got[nm]['g'].shape[0], got[nm]['k']) for nm in PIECES))
    if 'check' in sys.argv[1:]: check(items)


if __name__ == '__main__':
    main()
