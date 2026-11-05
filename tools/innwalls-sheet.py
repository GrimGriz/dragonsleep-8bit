"""DEEP16 pipeline 2 (generated art): the Halfway Inn's walls and roofs -- art-wanted section 36 pages 7, 8 and 9A (2026-11-05, the exteriors seat; Griz: "5-9 we
need and it wants to build something fancy to do it") -> deep16/art/innwalls_p1.png/.json, an atlas the new draw path in js/iso.js (iso.house) lays square by square.

    python -I tools/innwalls-sheet.py          (`check` also writes dev/visions/innwalls-check.png: every module on the floor's grey, its anchor marked)

THE WALLS (page 7): three rows of modules -- the house's two stories of grey fieldstone, the one-story wing's, the barn's weathered planks -- each a plain stretch, a
window (the house: one on the ground floor, one upstairs), a doorway, the corner, and the knee-high cut stub (the wing's and the barn's; the house's is the wing's
stone). The page draws them as near faces along the grid's x, at a slope of about 0.35 where the grid's is 0.5: each module's face is fitted by an affine map --
its bottom-left corner, its front corner and its top at the left -- onto exactly one square of wall at its building's height (the code's roofs, inn.js In.ROOFS:
the house 72 px, the wing 36, the barn 48, the stubs In.STUB's 8), then snapped to the palette with no outline (it would be a seam between modules). `_x` faces
+y (a south wall), `_y` is the same mirrored, facing +x (an east wall). Anchor: the face's foot at its west end (`_x`) or north end (`_y`).
  - THE DOORS: the page drew each leaf ajar and swung OUT toward the camera (its notes: "the inward swing ... needs correction"); the leaf is taken out, the stone
    behind it put back from the plain module, and the opening shut with the leaf's own boards resampled into it. The barn's door is page 5's closed double
    doors, one square of wall face (its notes: "check the closed door unit against the opening").
  - THE LIT WINDOWS (page 9A): its two lit walls are drawn with other masonry and other window places, so their light is lifted out, not their walls: page 7's
    own glass (the near-black inside each frame) mapped with its module and lit at the module's size in page 9A's colours, warmest at its middle, the mullions
    kept (the notes: "register the panes or extract the lighting to avoid a wall jump"). `*_lit` for dusk and night, every window of the three.
THE ROOFS (page 8): the page's checkerboard matte stripped (alpha under 200: its gutters are 41-52, the drawings opaque), each piece kept whole with its corners --
the slopes and ridge drawn for a ridge along the grid's y, mirrored for the inn's (all three ridge along x); js/iso.js maps them onto each roof by its pitch.
THE DOOR LAMPS (page 9A): unlit and lit, one anchor (the plate's foot), mirrored for an east wall.
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
IP = _load('innprops', os.path.join(ROOT, 'tools', 'innprops-sheet.py'))
pix = IP.pix
SRC = IP.SRC
PAGE = {'P07': 'halfway-p07/P07-WALLS-SOURCE.png', 'P08': 'halfway-p08/P08-ROOFS-SOURCE.png', 'P09A': 'halfway-p09/P09A-SUPPER-AND-LIGHTING.png',
        'P05': 'halfway-p05/P05-BARN-SOURCE.png'}
HW, HH = 32, 16
HEIGHT = {'house': 72, 'wing': 36, 'barn': 48, 'stub': 8}    # (px: js/iso.js iso.roofPx of inn.js In.ROOFS I, J, Z and In.STUB)

# page 7's cells (x0, y0, x1, y1), by row
WALLS = {
    'house': {'plain': (100, 45, 335, 460), 'win': (390, 45, 620, 460), 'winup': (680, 45, 910, 460), 'door': (960, 45, 1195, 460), 'corner': (1255, 62, 1515, 460)},
    'wing':  {'plain': (100, 485, 322, 695), 'win': (388, 485, 612, 695), 'door': (678, 485, 902, 695), 'corner': (965, 495, 1215, 695), 'stub': (1272, 540, 1520, 698)},
    'barn':  {'plain': (98, 716, 322, 930), 'win': (385, 716, 610, 930), 'door': (673, 716, 900, 932), 'corner': (965, 720, 1217, 930), 'stub': (1265, 780, 1508, 933)},
}
BARN_DOORS = (1175, 65, 1555, 590)            # page 5: the closed double doors
LAMPS = {'lamp': (195, 745, 350, 955), 'lamplit': (676, 745, 830, 955)}
ROOF_ROWS = {'house': (40, 395), 'wing': (395, 640), 'barn': (640, 950)}  # page 8's rows (y), each: ridge, lit slope, shaded slope, gable A, gable B left to right


def page(p):
    return np.array(Image.open(os.path.join(SRC, PAGE[p])).convert('RGBA'))


def cell(a, box, thr=128):
    """a cell's drawing alone (its own blobs), as float RGBA, and its mask"""
    g = IP.blobs_in(a, box).copy()
    g[g[..., 3] < thr] = 0
    return g


def face_points(g, ref=None):
    """the face's bottom-left (xL, yB), its top at the left (xL, yT) and its front corner (xF, yF) -- the lowest point of the face's foot. `ref`: another
    module of the row whose run to take (a doorway's leaf hangs lower than its face)"""
    m = g[..., 3] > 0
    cols = m.sum(0)
    xL = int(np.where(cols > 0.55 * cols.max())[0].min())
    ys = np.where(m[:, xL])[0]
    yT, yB = int(ys.min()), int(ys.max())
    if ref is not None:
        return dict(xL=xL, yT=yT, yB=yB, xF=xL + ref['xF'] - ref['xL'], yF=yB + ref['yF'] - ref['yB'])
    bot = np.array([np.where(m[:, x])[0].max() if m[:, x].any() else -1 for x in range(m.shape[1])])
    yF = int(bot.max()); xF = int(np.where(bot >= yF - 1)[0].min())
    return dict(xL=xL, yT=yT, yB=yB, xF=xF, yF=yF)


def affine_fit(g, src3, dst3, size=None):
    """g (RGBA uint8) mapped so the three source points land on the three target points; returns (image uint8, offset of target (0,0) in it)"""
    S = np.array([[p[0], p[1], 1.0] for p in src3]); T = np.array([[p[0], p[1]] for p in dst3])
    M = np.linalg.solve(S, T)                       # [x y 1] @ M = [x' y']
    A = M[:2].T; t = M[2]
    h, w = g.shape[:2]
    corners = np.array([[0, 0], [w, 0], [0, h], [w, h]], float) @ A.T + t
    x0, y0 = np.floor(corners.min(0)).astype(int) - 1; x1, y1 = np.ceil(corners.max(0)).astype(int) + 1
    W, H = x1 - x0, y1 - y0
    inv = np.linalg.inv(A)
    # PIL's AFFINE wants, for each output pixel (X, Y), the input (x, y) = inv @ ((X + x0, Y + y0) - t)
    a, b, c = inv[0, 0], inv[0, 1], -(inv[0, 0] * (t[0] - x0) + inv[0, 1] * (t[1] - y0))
    d, e, f = inv[1, 0], inv[1, 1], -(inv[1, 0] * (t[0] - x0) + inv[1, 1] * (t[1] - y0))
    im = Image.fromarray(g, 'RGBA')
    # (premultiplied so the edge's colour does not bleed the empty black in; BOX-like by supersampling 3x then averaging)
    SS = 3
    big = im.transform((W * SS, H * SS), Image.AFFINE, (a / SS, b / SS, c, d / SS, e / SS, f), resample=Image.BILINEAR)
    arr = np.asarray(big).astype(np.float32) / 255.0
    al = arr[..., 3:4]
    arr = arr.reshape(H, SS, W, SS, 4)
    alpha = arr[..., 3].mean((1, 3))
    rgb = (arr[..., :3] * arr[..., 3:4]).sum((1, 3)) / np.maximum(arr[..., 3:4].sum((1, 3)), 1e-6)
    return rgb, alpha, (-x0, -y0)


def snap(rgb, alpha, cut=0.5):
    out = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    solid = alpha >= cut
    out[solid, :3] = pix.snap(rgb)[solid]; out[solid, 3] = 255
    return out


def trimmed(img, off):
    ys, xs = np.where(img[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return img[y0:y1, x0:x1], (off[0] - x0, off[1] - y0)


def module(g, P, Hpx, mirror=False, glass=None):
    """a page-7 module fitted onto one square of wall, Hpx tall at its left; returns {g, ax, ay}. `glass`: the window's glass on the page, mapped the same
    way and lit at the module's own size -- warm light by the palette's own colours, brightest at its middle (page 9A's lit panes' colours)"""
    if mirror:
        w = g.shape[1]; g = g[:, ::-1].copy(); glass = glass[:, ::-1].copy() if glass is not None else None
        src = [(w - 1 - P['xL'], P['yB']), (w - 1 - P['xF'], P['yF']), (w - 1 - P['xL'], P['yT'])]
        dst = [(0, 0), (-2 * HH, HH), (0, -Hpx)]
    else:
        src = [(P['xL'], P['yB']), (P['xF'], P['yF']), (P['xL'], P['yT'])]
        dst = [(0, 0), (2 * HH, HH), (0, -Hpx)]
    rgb, al, off = affine_fit(g, src, dst)
    img = snap(rgb, al)
    if glass is not None:
        gm = np.zeros(g.shape, np.uint8); gm[..., 3] = np.where(glass, 255, 0); gm[..., :3] = 255
        _, gal, _ = affine_fit(gm, src, dst)
        lit = (gal > 0.45) & (img[..., 3] > 0)
        ys, xs = np.where(lit)
        if len(ys):
            cy, cx = (ys.min() + ys.max()) / 2.0, (xs.min() + xs.max()) / 2.0
            ry, rx = max(1.0, (ys.max() - ys.min()) / 2.0), max(1.0, (xs.max() - xs.min()) / 2.0)
            warm = pix.snap(np.array([[[1.0, 0.88, 0.55], [0.96, 0.68, 0.28], [0.80, 0.44, 0.16]]], np.float32))[0]
            for y, x in zip(ys, xs):
                dd = ((y - cy) / ry) ** 2 + ((x - cx) / rx) ** 2
                img[y, x, :3] = warm[0] if dd < 0.35 else warm[1] if dd < 0.8 else warm[2]
    img, off = trimmed(img, off)
    return dict(g=img, ax=int(off[0]), ay=int(off[1]), foot=[1, 1])


def glass_of(win):
    """the window's glass on page 7: the near-black inside its frame (the mortar between the stones is a dark brown, lighter), the lights round the cross"""
    L = lum(win); dark = (win[..., 3] > 0) & (L < 24)
    lab, n = ndimage.label(dark); sizes = ndimage.sum(dark, lab, range(1, n + 1))
    order = sorted(range(1, n + 1), key=lambda k: -sizes[k - 1])
    k0 = order[0]; sl0 = ndimage.find_objects((lab == k0).astype(int))[0]
    cy, cx = (sl0[0].start + sl0[0].stop) / 2.0, (sl0[1].start + sl0[1].stop) / 2.0
    keep = np.zeros_like(dark)
    for k in order[:8]:
        sl = ndimage.find_objects((lab == k).astype(int))[0]
        if abs((sl[0].start + sl[0].stop) / 2.0 - cy) < 70 and abs((sl[1].start + sl[1].stop) / 2.0 - cx) < 70 and sizes[k - 1] > 0.1 * sizes[k0 - 1]: keep |= lab == k
    return ndimage.binary_closing(keep, iterations=3) & dark | keep


def lum(g): return g[..., :3].astype(np.float32).mean(-1)


def shut_door(door, plain, Pd, Pp):
    """the doorway with its leaf taken out (the plain module's stone put back where it hung) and the opening shut with the leaf's boards"""
    d = door.copy()
    # align the plain module onto the doorway's cell by the face's bottom-left
    dx, dy = Pd['xL'] - Pp['xL'], Pd['yB'] - Pp['yB']
    pl = np.zeros_like(d)
    h, w = plain.shape[:2]
    ys0, xs0 = max(0, dy), max(0, dx)
    ys1, xs1 = min(d.shape[0], h + dy), min(d.shape[1], w + dx)
    pl[ys0:ys1, xs0:xs1] = plain[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    L = lum(d); r, gg, b = d[..., 0].astype(int), d[..., 1].astype(int), d[..., 2].astype(int)
    wood = (d[..., 3] > 0) & (r > gg + 12) & (r > b + 25)                # (the leaf's boards: warm; the stone is grey)
    dark = (d[..., 3] > 0) & (L < 34)
    lab, n = ndimage.label(dark); sizes = ndimage.sum(dark, lab, range(1, n + 1))
    opening = lab == (int(np.argmax(sizes)) + 1)
    ox = np.where(opening.any(0))[0]; ox0, ox1 = ox.min(), ox.max()
    # the leaf: the wood by the opening -- it hangs out over the face to the right of and below the opening
    oy = np.where(opening.any(1))[0]; near = np.zeros_like(wood)
    near[max(0, oy.min() - 6):, max(0, ox0 - 6):min(d.shape[1], ox1 + (ox1 - ox0) + 12)] = True
    wood &= near
    labw, nw = ndimage.label(wood); szw = ndimage.sum(wood, labw, range(1, nw + 1))
    leaf = labw == (int(np.argmax(szw)) + 1)
    leaf = ndimage.binary_dilation(leaf, iterations=1) & (d[..., 3] > 0) & ~opening
    ly, lx = np.where(leaf)
    tex = d[ly.min():ly.max() + 1, lx.min():lx.max() + 1].copy(); tm = leaf[ly.min():ly.max() + 1, lx.min():lx.max() + 1]
    # (the leaf drawn on a slant, open: read it column by column, top to bottom of its boards)
    out = d.copy()
    out[leaf] = pl[leaf]                                                # (the stone behind the leaf)
    gone = leaf & (pl[..., 3] == 0); out[gone] = 0                       # (where it hung out past the wall)
    for x in range(ox0, ox1 + 1):
        ys = np.where(opening[:, x])[0]
        if not len(ys): continue
        t0, t1 = ys.min(), ys.max()
        u = (x - ox0) / max(1.0, ox1 - ox0)
        tc = int(round(u * (tex.shape[1] - 1)))
        col = np.where(tm[:, tc])[0]
        if not len(col): continue
        c0, c1 = col.min(), col.max()
        for y in range(t0, t1 + 1):
            v = (y - t0) / max(1.0, t1 - t0)
            out[y, x] = tex[int(round(c0 + v * (c1 - c0))), tc]
    return out


def roof_piece(a, box, mirror):
    x0, y0, x1, y1 = box
    g = a[max(0, y0):y1, max(0, x0):x1].copy(); g[g[..., 3] < 200] = 0          # (the matte and its glow stripped)
    lab, n = ndimage.label(g[..., 3] > 0); sizes = ndimage.sum(g[..., 3] > 0, lab, range(1, n + 1))
    g[lab != (int(np.argmax(sizes)) + 1)] = 0
    g[..., 3] = np.where(g[..., 3] > 0, 255, 0)
    g = IP.trim(g)
    if mirror: g = g[:, ::-1].copy()
    k = 2.0
    small = IP.GS.game(g, k)                       # (snapped and outlined at half the page's size: js/iso.js maps it onto the roof)
    m = small[..., 3] > 0; ys, xs = np.where(m)
    pts = {'minx': [int(xs.min()), int(np.median(ys[xs == xs.min()]))], 'maxx': [int(xs.max()), int(np.median(ys[xs == xs.max()]))],
           'miny': [int(np.median(xs[ys == ys.min()])), int(ys.min())], 'maxy': [int(np.median(xs[ys == ys.max()])), int(ys.max())]}
    return dict(g=small, ax=0, ay=0, foot=[1, 1], pts=pts)


def roof_cells(a, row):
    y0, y1 = ROOF_ROWS[row]
    m = a[y0:y1, :, 3] >= 200
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2)); sizes = ndimage.sum(m, lab, range(1, n + 1))
    sls = sorted([sl for i, sl in enumerate(ndimage.find_objects(lab)) if sizes[i] > 2000], key=lambda sl: sl[1].start)
    return [(sl[1].start - 4, sl[0].start + y0 - 4, sl[1].stop + 4, sl[0].stop + y0 + 4) for sl in sls][:5]


def main():
    pages = {p: page(p) for p in PAGE}
    a7 = pages['P07']
    items = []
    for mat, cells in WALLS.items():
        G = {kind: cell(a7, box) for kind, box in cells.items()}
        Pp = face_points(G['plain'])
        Hm = HEIGHT[mat]
        for kind in ('plain', 'win', 'winup', 'door'):
            if kind not in G: continue
            g = G[kind]; P = face_points(g, ref=Pp)
            if kind == 'door' and mat == 'barn':   # (page 5's closed doors, drawn as one square of an east wall: mirrored to a south one, then fitted as any module)
                g = IP.trim(cell(pages['P05'], BARN_DOORS))[:, ::-1].copy(); P = face_points(g)
            elif kind == 'door':
                g = shut_door(g, G['plain'], P, Pp)
            for ori, mir in (('x', False), ('y', True)):
                items.append(('%s_%s_%s' % (mat, kind, ori), module(g, P, Hm, mir)))
            if kind in ('win', 'winup'):     # (lit at dusk and by night: page 7's own glass, lit in page 9A's colours at the module's size -- no wall jump)
                gls = glass_of(g)
                for ori, mir in (('x', False), ('y', True)):
                    items.append(('%s_%s_lit_%s' % (mat, kind, ori), module(g, P, Hm, mir, glass=gls)))
        # the corner: its south face (left of the front corner) and its east face (right of it), each fitted as a module of its own run
        g = G['corner']; m = g[..., 3] > 0
        bot = np.array([np.where(m[:, x])[0].max() if m[:, x].any() else -1 for x in range(m.shape[1])])
        xC = int(np.argmax(bot)); yC = int(bot[xC])
        colsC = np.where(m[:, xC])[0]; yTC = int(colsC.min())
        runP = Pp['xF'] - Pp['xL']
        for side in ('L', 'R'):
            part = g.copy()
            if side == 'L': part[:, xC + 1:] = 0
            else: part[:, :xC] = 0
            xs = np.where(part[..., 3].any(0))[0]
            xe = xs.min() if side == 'L' else xs.max()
            ye = int(np.where(part[:, xe, 3] > 0)[0].max())
            f = abs(xC - xe) / float(runP)                 # (its run as a part of a square, by the plain module's)
            sgn = -1 if side == 'L' else 1
            src = [(xC, yC), (xe, ye), (xC, yTC)]
            dst = [(0, 0), (sgn * 2 * HH * f, -HH * f), (0, -Hm)]
            rgb, al, off = affine_fit(part, src, dst)
            img, off = trimmed(snap(rgb, al), off)
            items.append(('%s_corner%s' % (mat, side), dict(g=img, ax=int(off[0]), ay=int(off[1]), foot=[1, 1])))
        if 'stub' in G:
            Ps = face_points(G['stub'])
            for ori, mir in (('x', False), ('y', True)):
                items.append(('%s_stub_%s' % (mat, ori), module(G['stub'], Ps, HEIGHT['stub'], mir)))
    # the roofs
    a8 = pages['P08']
    roofs = {}
    for row in ROOF_ROWS:
        cl = roof_cells(a8, row)
        names = ['ridge', 'slope', 'shade', 'gableA', 'gableB']
        for nm, box in zip(names, cl):
            mir = nm in ('ridge', 'slope', 'shade')         # (drawn for a ridge along y: mirrored, along x; the gable for the east end is A as drawn)
            pc = roof_piece(a8, box, mir)
            items.append(('roof_%s_%s' % (row, nm), pc)); roofs['roof_%s_%s' % (row, nm)] = pc['pts']
    # the door lamps: their plate's foot the anchor
    a9 = pages['P09A']
    for nm, box in LAMPS.items():
        g = IP.trim(cell(a9, box, thr=200))
        for ori, mir in (('x', False), ('y', True)):
            gg = g[:, ::-1].copy() if mir else g
            small = IP.trim(IP.GS.game(gg, g.shape[0] / 30.0))
            m = small[..., 3] > 0; ys, xs = np.where(m)
            items.append(('%s_%s' % (nm, ori), dict(g=small, ax=int(xs.max() if mir else xs.min()), ay=int(ys.max()), foot=[1, 1])))
    sheet, tiles = IP.pack(items, width=1024)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, 'innwalls_p1.png'), optimize=True)
    meta = {'_note': 'the Halfway Inn\'s walls and roofs (tools/innwalls-sheet.py, art-wanted section 36 pages 7, 8 and 9A, 2026-11-05): each wall module a box x,y,w,h '
                     'and its anchor ax,ay -- its face\'s foot at its west end (_x, a south wall) or its north end (_y, an east wall), one square long, its building\'s '
                     'height tall; the corner\'s two halves anchored at the corner\'s foot; the roofs\' pieces whole with their corners (`roofpts`, minx/maxx/miny/maxy '
                     'in the piece) for js/iso.js iso.house to map onto each roof.',
            'image': 'art/innwalls_p1.png', 'fw': 64, 'fh': 64, 'ax': 32, 'ay': 48, 'prop': True, 'anims': {}, 'tiles': tiles, 'roofpts': roofs, 'height': HEIGHT,
            'source': 'generated by the art desk (2026-11-04, ART-36 pages 7, 8 and 9A: deep16/_src/halfway-inn/ART-36-PAGES-01-09), cut by tools/innwalls-sheet.py'}
    with open(os.path.join(pix.ART, 'innwalls_p1.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, indent=1)
    print('innwalls_p1:', sheet.shape[1], 'x', sheet.shape[0], '|', len(items), 'pieces:', ', '.join('%s %dx%d' % (nm, p['g'].shape[1], p['g'].shape[0]) for nm, p in items))
    if 'check' in sys.argv[1:]: IP.check(items, 'innwalls-check.png')


if __name__ == '__main__':
    main()
