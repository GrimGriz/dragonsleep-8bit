"""DEEP16 pipeline 2 (generated art): the top-down places' tiles -- the art desk's ART-111 (Silverton, seven HEADs), cut into toptiles_p1. The same
machinery cuts ART-112 (the Guano Mine's top levels: tools/minetiles-sheet.py -> minetiles_p1) and ART-113 (the Glowseep: tools/seeptiles-sheet.py ->
seeptiles_p1); they load this file for it, as tools/roadprops-sheet.py loads gsprops-sheet.py.

    python tools/toptiles-sheet.py           (`check` also writes dev/visions/toptiles-check.png: the atlas at 4x on navy)

Asked in deep16-art-wanted.md section 21 (97e10ff, sent 10-22 as _src/art-desk/sent/ASK-2026-10-22-top-down-tiles.md) on Griz's words to the lanes desk:
"have the 2d places, silverton, surface guano mines and gallieries, the wet - compose a tile art request that includes variants and any props they want",
"i meant glowseep, not wet". Taken in on his "art 111-113 are in to see if we can give the top down something to work with" (10-22).

Sources (gitignored, deep16/_src/): toptiles/ART-111/ (twelve pages and MANIFEST.json), its papers in _src/art-desk/received-2026-10-22-ART-111/.
The art desk drew each piece on a navy page at about three times the game's size, no common factor, labelled beside it; its MANIFEST.json gives every
piece's window on its page. A piece is cut from its window:

  - a GROUND (a tile that fills its square: the grounds, their edges, the roofs, the rock): the rows and columns of the window that are mostly drawing
    (not navy) bound the tile; two source pixels are shaved off each side (the page draws a dark rim round each tile, which would show as a grid);
    then the tile is boxed down to 48 x 48 (an average over each target pixel's source pixels) and snapped to deep16/palette.json (tools/pixelate.py
    snap: the nearest of the 64 colours in Lab) -- no lift: the art desk's colours are a 16-bit page's already.
  - THE ROAD WITH NO RUTS (`road_plain`, made here, not drawn by the art desk): the beaten earth's four tiles with each pixel given the road's colour of the
    same rank by lightness -- the earth's pebbles in the road's dust. js/topview.js lays it where the packed dirt is wider than a road (a plaza, a crossing):
    the ruts, tiled every way across a plaza, read as a ploughed field.
  - a FACE (a wall's south face, a door, the cliff): the same, boxed to its own size (FACE_PX), opaque.
  - a PROP (anything standing alone on the navy): the drawing's own pixels (every blob of not-navy in its window big enough not to be a stray
    speck), boxed down by its own scale with the alpha premultiplied, the alpha cut at a half, snapped, and outlined a pixel round in the palette's
    outline (as the creatures are: tools/pixelate.py pixelate). Its anchor (ax, ay) is the middle of its footprint's south edge.

The atlas (deep16/art/<sheet>.png) lays the pieces row by row; deep16/art/<sheet>.json names each one's box -- tiles: {name: 'x,y,w,h,ax,ay x,y,...'}
(a kind's variants in order, space-separated) -- and, for each pair of grounds that has its edges drawn, which edge tile stands at a corner where the four squares
round it are the two grounds in each arrangement (`dual`, below). tools/deep16-build.py carries the json into data/sprites.js with the sheets.

THE EDGES (js/topview.js reads them): the art desk drew each edge set as a ground meeting another along a line through the tile's middle -- the edge
tiles of a dual grid, a tile centred on the corner where four squares meet, each of its quarters the square it lies on. Which tile is which is read from
the tile itself, not its name (the pages name them two ways, and HEAD1 PAGE2's stone corners are kerb strips, its notes say): each cut tile's four
quarters are measured for how much of the foreground ground is in them (each pixel nearer the foreground's fill tiles' mean colour than the
background's), and for each of the sixteen arrangements of the four squares (a bit a quarter: NW 1, NE 2, SW 4, SE 8) the tile whose quarters are
nearest is named, when one is near enough (NEAR); 0 and 15 are the fills, and an arrangement with no tile near enough is drawn as the squares are.
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
PX = _load('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))   # SRC (the main checkout's _src from a worktree), snap(), OUTLINE
T = 48
SHAVE = 2          # source pixels off each side of a ground's box (the page's rim round each tile)
NEAR = 0.12        # an edge tile's quarters within this (mean squared) of the arrangement's, or the arrangement draws as its squares


# ------------------------------------------------------------------ the art desk's manifests, three shapes, read as one
def manifest(sheet, art):
    """{id: (page path, (x, y, w, h), (fw, fh) footprint in squares)}"""
    d = os.path.join(PX.SRC, sheet, art)
    m = json.load(open(os.path.join(d, 'MANIFEST.json'), encoding='utf-8'))
    out = {}
    for e in m.get('entries') or m.get('items') or m.get('records'):
        key = e.get('id') or e.get('key')
        if e.get('frame_1based'):
            key = key + '_f%d' % e['frame_1based']
        r = e.get('source_rectangle_px')
        rect = (r['x'], r['y'], r['width'], r['height']) if r else tuple(e['source_rect_xywh'])
        page = os.path.join(d, os.path.basename(e['source']))
        out[key] = (page, rect, tuple(e.get('native_footprint_tiles') or (1, 1)))
    return out


_pages = {}
def page(path):
    if path not in _pages:
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
        b = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
        _pages[path] = (a, np.median(b, axis=0))                       # (the page's navy: its border's middle colour)
    return _pages[path]


def drawn(a, bg, tol=36):
    """the pixels that are drawing, not the page's navy (which wanders a little across a page)"""
    d = np.sqrt(((a - bg[None, None, :]) ** 2).sum(-1))
    navyish = (a[..., 2] > a[..., 0] + 14) & (a[..., 2] > a[..., 1] + 4) & (d < tol * 1.8)
    return (d > tol) & ~navyish


def box_down(rgb, w, h, alpha=None):
    """an average over each target pixel's source pixels (fractional edges weighted), alpha-premultiplied when there is one"""
    H, W = rgb.shape[:2]
    def weights(n_src, n_dst):
        M = np.zeros((n_dst, n_src), dtype=np.float64); s = n_src / n_dst
        for i in range(n_dst):
            a0, a1 = i * s, (i + 1) * s
            for j in range(int(np.floor(a0)), min(n_src, int(np.ceil(a1)))):
                M[i, j] = min(a1, j + 1) - max(a0, j)
        return M / M.sum(1, keepdims=True)
    Wy, Wx = weights(H, h), weights(W, w)
    two = lambda c: np.stack([Wy @ c[..., k] @ Wx.T for k in range(c.shape[-1])], -1)
    if alpha is None:
        return two(rgb.astype(np.float64)), None
    al = alpha.astype(np.float64)
    A = Wy @ al @ Wx.T
    C = two(rgb.astype(np.float64) * al[..., None]) / np.maximum(A[..., None], 1e-6)
    return C, A


def snap(rgb255):
    return PX.snap(np.clip(rgb255 / 255.0, 0, 1).astype(np.float32))


def ground_box(win, bg, most=6):
    """the window's tile: the art desk's windows are tight round each tile already (measured), so only an edge row or column that is plainly the
    page's navy is trimmed, a few at most (a colour mask would take the Glowseep's dark water for navy)"""
    d = np.sqrt(((win - bg[None, None, :]) ** 2).sum(-1)) < 14
    r0, r1, c0, c1 = 0, win.shape[0], 0, win.shape[1]
    while r0 < most and d[r0, c0:c1].mean() > 0.85: r0 += 1
    while win.shape[0] - r1 < most and d[r1 - 1, c0:c1].mean() > 0.85: r1 -= 1
    while c0 < most and d[r0:r1, c0].mean() > 0.85: c0 += 1
    while win.shape[1] - c1 < most and d[r0:r1, c1 - 1].mean() > 0.85: c1 -= 1
    return r0, r1, c0, c1


def cut_ground(entry, w=T, h=T, shave=SHAVE, sub=None):
    """sub: (x0, y0, x1, y1), fractions of the tile -- a part of it boxed down to the whole (the Glowseep's water from its inner corners)"""
    path, (x, y, ww, hh), _ = entry
    a, bg = page(path)
    win = a[y:y + hh, x:x + ww]
    r0, r1, c0, c1 = ground_box(win, bg)
    t = win[r0 + shave:r1 - shave, c0 + shave:c1 - shave]
    if sub:
        H0, W0 = t.shape[:2]
        t = t[int(sub[1] * H0):int(sub[3] * H0), int(sub[0] * W0):int(sub[2] * W0)]
    rgb, _ = box_down(t, w, h)
    out = np.zeros((h, w, 4), dtype=np.uint8); out[..., :3] = snap(rgb); out[..., 3] = 255
    return out


def cut_prop(entry, scale=None, width=None, height=None, min_blob=40, outline=True, keep=None):
    """a drawing on the navy -> RGBA at the game's size: by `scale` (game px a source px), or to a `width` or a `height` in game px"""
    path, (x, y, ww, hh), fp = entry
    a, bg = page(path)
    win = a[y:y + hh, x:x + ww]
    m = drawn(win, bg)
    m = ndimage.binary_closing(m, iterations=1)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        big = sizes.max()
        ok = [i + 1 for i, s in enumerate(sizes) if s >= max(min_blob, big * 0.004)]
        objs = ndimage.find_objects(lab)
        b0 = objs[int(np.argmax(sizes))]; mh, mw = b0[0].stop - b0[0].start, b0[1].stop - b0[1].start
        near = lambda o: o[0].start < b0[0].stop + 0.06 * mh and o[0].stop > b0[0].start - 0.06 * mh and o[1].start < b0[1].stop + 0.12 * mw and o[1].stop > b0[1].start - 0.12 * mw
        ok = [i for i in ok if near(objs[i - 1])]                       # (a label beside the drawing is a blob of its own, apart from it: dropped)
        def lettering(i):                                               # (a small blob of the pages' pale lettering, beside the drawing: dropped too)
            px = win[lab == i].astype(np.float64)
            return sizes[i - 1] < big * 0.05 and px.mean() > 150 and (px.max(1) - px.min(1)).mean() < 60
        ok = [i for i in ok if i == int(np.argmax(sizes)) + 1 or not lettering(i)]
        if keep is not None: ok = [i for i in ok if keep(ndimage.find_objects((lab == i).astype(int))[0])]
        m = np.isin(lab, ok)
    m = ndimage.binary_fill_holes(m)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    t, al = win[y0:y1, x0:x1], m[y0:y1, x0:x1].astype(np.float64)
    if scale is None:
        scale = (width / (x1 - x0)) if width else (height / (y1 - y0))
    W2, H2 = max(1, int(round((x1 - x0) * scale))), max(1, int(round((y1 - y0) * scale)))
    rgb, A = box_down(t, W2, H2, al)
    solid = A >= 0.5
    pad = 1 if outline else 0
    out = np.zeros((H2 + 2 * pad, W2 + 2 * pad, 4), dtype=np.uint8)
    s2 = np.zeros(out.shape[:2], dtype=bool); s2[pad:pad + H2, pad:pad + W2] = solid
    col = np.zeros(out.shape[:2] + (3,), dtype=np.uint8); col[pad:pad + H2, pad:pad + W2] = snap(rgb)
    out[s2, :3] = col[s2]; out[s2, 3] = 255
    if outline:
        e = np.zeros_like(s2)
        e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
        edge = e & ~s2
        out[edge, :3] = PX.OUTLINE; out[edge, 3] = 255
    return out, scale


# ------------------------------------------------------------------ the edges: which tile stands at each arrangement of four squares
def quarters(tile, fg_mean, bg_mean):
    """how much of each quarter (NW, NE, SW, SE) is the foreground ground"""
    c = tile[..., :3].astype(np.float64)
    df = ((c - fg_mean) ** 2).sum(-1); db = ((c - bg_mean) ** 2).sum(-1)
    f = (df < db).astype(np.float64)
    f = ndimage.uniform_filter(f, 5)                                # (a speck of the other colour doesn't count)
    hh = tile.shape[0] // 2
    return [f[:hh, :hh].mean(), f[:hh, hh:].mean(), f[hh:, :hh].mean(), f[hh:, hh:].mean()]


LUM = np.array([0.299, 0.587, 0.114])
def remap(px, ref):
    """px's colours (n x 3), each distinct colour whole, onto ref's colours (m x 3) at the same middle rank by lightness"""
    if not len(px): return px
    order = ref[np.argsort(ref.astype(np.float64) @ LUM)]
    cols, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    o2 = np.argsort(cols.astype(np.float64) @ LUM); start = np.zeros(len(cols)); start[o2] = np.concatenate([[0], np.cumsum(cnt[o2])[:-1]])
    mid = (start + cnt / 2.0) / len(px)
    return order[(mid[inv.ravel()] * (len(order) - 1)).astype(int)]


def harmonize(tile, fgm, bgm, fg_ref, bg_ref):
    """an edge tile's two grounds put in their fills' own colours: the edge pages were drawn apart from the fills' and came out paler or darker, a halo
    round every patch (the guano's crust, 10-22) -- each pixel is the ground whose fills' mean it is nearer, and each ground's colours are remapped"""
    c = tile[..., :3].reshape(-1, 3)
    f = ((c.astype(np.float64) - fgm) ** 2).sum(-1) < ((c.astype(np.float64) - bgm) ** 2).sum(-1)
    out = c.copy()
    out[f] = remap(c[f], fg_ref); out[~f] = remap(c[~f], bg_ref)
    tile[..., :3] = out.reshape(tile.shape[:2] + (3,))


def dual_table(tiles, edge_names, fg_fill, bg_fill, tone=True):
    """{mask: (name, its quarters, the distance)} for masks 1-14 that a tile is near enough to; `tone`: the edge tiles harmonized to the fills first"""
    mean = lambda names: np.concatenate([tiles[n][14:34, 14:34, :3].reshape(-1, 3) for n in names]).astype(np.float64).mean(0)   # (the fills' middles: the Glowseep's pools have their banks painted in)
    fgm, bgm = mean(fg_fill), mean(bg_fill)
    q = {n: quarters(tiles[n], fgm, bgm) for n in edge_names}
    if tone:                                                            # (after the measure: the quarters are read off the art as drawn)
        ref = lambda names: np.concatenate([tiles[n][4:44, 4:44, :3].reshape(-1, 3) for n in names])
        fr, br = ref(fg_fill), ref(bg_fill)
        for n in edge_names: harmonize(tiles[n], fgm, bgm, fr, br)
    out = {}
    for mask in range(1, 15):
        want = [(mask >> b) & 1 for b in range(4)]
        best = min(q, key=lambda n: sum((q[n][i] - want[i]) ** 2 for i in range(4)))
        dist = sum((q[best][i] - want[i]) ** 2 for i in range(4)) / 4
        if dist <= NEAR:
            out[mask] = (best, [round(v, 2) for v in q[best]], round(dist, 3))
    return out, q


# ------------------------------------------------------------------ the atlas
class Atlas:
    def __init__(self, width=1024):
        self.W, self.items, self.x, self.y, self.rowh = width, [], 0, 0, 0
        self.tiles = {}
        self.pixels = {}

    def add(self, name, img, ax=None, ay=None):
        h, w = img.shape[:2]
        if self.x + w > self.W:
            self.x, self.y, self.rowh = 0, self.y + self.rowh, 0
        self.items.append((self.x, self.y, img))
        if ax is None: ax = w // 2
        if ay is None: ay = h
        self.tiles.setdefault(name, []).append([self.x, self.y, w, h, int(ax), int(ay)])
        self.pixels.setdefault(name, []).append(img)
        self.x += w; self.rowh = max(self.rowh, h)

    def newrow(self):
        if self.x:
            self.x, self.y, self.rowh = 0, self.y + self.rowh, 0

    def image(self):
        H = self.y + self.rowh
        a = np.zeros((H, self.W, 4), dtype=np.uint8)
        for x, y, img in self.items:
            h, w = img.shape[:2]; a[y:y + h, x:x + w] = img
        return a

    def write(self, sheet, source, extra=None, check=False):
        a = self.image()
        art = os.path.join(ROOT, 'deep16', 'art')
        Image.fromarray(a, 'RGBA').save(os.path.join(art, sheet + '.png'), optimize=True)
        pack = lambda b: ','.join(str(int(v)) for v in b)               # (a box as one string, a name's variants space-separated: data/sprites.js writes a list an item a line)
        meta = {'image': 'art/%s.png' % sheet, 'fw': T, 'fh': T, 'ax': T // 2, 'ay': T, 'top': 0, 'anims': {}, 'tiles': {k: ' '.join(pack(b) for b in v) for k, v in self.tiles.items()}, 'source': source}
        meta.update(extra or {})
        for d in (meta.get('dual') or {}).values():
            d['mask'] = {k: pack(b) for k, b in d['mask'].items()}
        with open(os.path.join(art, sheet + '.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump(meta, f, indent=0)
        print('wrote deep16/art/%s.png (%d x %d, %d pieces in %d names)' % (sheet, a.shape[1], a.shape[0], sum(len(v) for v in self.tiles.values()), len(self.tiles)))
        if check:
            vis = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(vis, exist_ok=True)
            bgc = np.zeros_like(a); bgc[..., :3] = (10, 22, 56); bgc[..., 3] = 255
            al = a[..., 3:4] / 255.0
            c = (a[..., :3] * al + bgc[..., :3] * (1 - al)).astype(np.uint8)
            Image.fromarray(c, 'RGB').resize((c.shape[1] * 4, c.shape[0] * 4), Image.NEAREST).save(os.path.join(vis, sheet + '-check.png'))
            print('  dev/visions/%s-check.png' % sheet)


def corner_fills(M, tab):
    """a water's fill from the inner corners' water (the notch's opposite corner, 58% of the tile): the art desk painted banks into the Glowseep's
    pool and drain fills, which would tile as a grid of little pools"""
    region = {7: (0, 0, .58, .58), 11: (.42, 0, 1, .58), 13: (0, .42, .58, 1), 14: (.42, .42, 1, 1)}
    return [cut_ground(M[tab[mk][0]], sub=region[mk]) for mk in (14, 13, 11, 7) if mk in tab]


def report_dual(name, table, q):
    print('  edges %s: %d of 14 arrangements drawn' % (name, len(table)))
    for mask in range(1, 15):
        t = table.get(mask)
        print('    %2d %s%s%s%s  %s' % (mask, *(('#' if (mask >> b) & 1 else '.') for b in range(4)), ('%s %s d=%.3f' % t) if t else '-- (the squares as they are)'))


# ------------------------------------------------------------------ SILVERTON (ART-111)
FACE_PX = {'low': (T, 32), 'tall': (T, 48), 'cliff': (T, 64), 'roomwall': (T, 56)}

def silverton(check=False):
    M = manifest('toptiles', 'ART-111')
    A = Atlas(1152)
    tiles = {}
    def ground(name, mid, **kw):
        tiles[mid] = cut_ground(M[mid], **kw)
        A.add(name, tiles[mid], T // 2, T)
    # HEAD 1: the grounds, four a kind (the waters two frames)
    for kind, n in (('earth', 4), ('road', 4), ('grass', 4), ('dressed_stone', 4), ('threshold', 4), ('spoil', 4)):
        for i in range(n): ground(kind, '%s_v%d' % (kind, i + 1))
    for kind in ('fountain_water', 'river_water'):
        for i in range(2): ground(kind, '%s_f%d' % (kind, i + 1))
    A.newrow()
    # the road with no ruts (a plaza, a crossing): the beaten earth's texture in the road's own colours, rank for rank by lightness
    roadpx = np.concatenate([tiles['road_v%d' % (i + 1)][..., :3].reshape(-1, 3) for i in range(4)]).astype(np.float64)
    lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
    order = roadpx[np.argsort(lum(roadpx))]
    for i in range(4):
        e = tiles['earth_v%d' % (i + 1)][..., :3].reshape(-1, 3)
        cols, inv, cnt = np.unique(e, axis=0, return_inverse=True, return_counts=True)
        o2 = np.argsort(lum(cols.astype(np.float64))); start = np.zeros(len(cols)); start[o2] = np.concatenate([[0], np.cumsum(cnt[o2])[:-1]])
        mid = (start + cnt / 2.0) / len(e)                              # (each of the earth's colours whole, to the road's colour at its middle rank: no ties split)
        out = np.zeros((T, T, 4), dtype=np.uint8); out[..., :3] = snap(order[(mid[inv.ravel()] * (len(order) - 1)).astype(int)].reshape(T, T, 3)); out[..., 3] = 255
        tiles['road_plain_%d' % i] = out; A.add('road_plain', out, T // 2, T)
    A.newrow()
    # the edges: grass against earth, the dressed stone's kerb against the road, the river's banks against earth
    dual = {}
    sets = {'grass': ('grass', 'earth', 'grass_'), 'stone': ('dressed_stone', 'road', 'stone_'), 'river': ('river_water', 'earth', 'river_')}
    for key, (fg, bg, pre) in sets.items():
        names = [k for k in M if k.startswith(pre) and any(s in k for s in ('_edge_', '_outer_', '_inner_'))]
        for k in names: ground(key + '_edge', k)
        fgf = [k for k in M if k.startswith(fg + '_v') or k.startswith(fg + '_f')]
        bgf = [k for k in M if k.startswith(bg + '_v')]
        tab, q = dual_table(tiles, names, fgf, bgf, tone=key == 'stone')   # (the river's banks keep their stones; the grass's edges are turf, its fill tufts on earth -- toned, the turf went to earth)
        report_dual(key, tab, q)
        dual[key] = {'fg': fg, 'bg': bg, 'mask': {str(mk): A.tiles[key + '_edge'][names.index(t[0])][:4] for mk, t in tab.items()}}
    A.newrow()
    # the bank (a face down the slope) and its stair, two squares wide
    for k in ('bank_left', 'bank_middle', 'bank_right'): ground('bank', k)
    tiles['bank_stairs'] = cut_ground(M['bank_stairs'], w=2 * T, h=T); A.add('bank_stairs', tiles['bank_stairs'], T, T)
    A.newrow()
    # HEAD 2: the roofs, nine pieces and a one-square roof each; the wall-walk
    for roof in ('clay', 'slate', 'shingle', 'stone'):
        for p in ('NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE', 'single'): ground('roof_' + roof + '_' + p, 'roof_%s_%s' % (roof, p))
        A.newrow()
    for p in ('NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE', 'single'): ground('wallwalk_' + p, 'wall_walk_' + p)
    A.newrow()
    # HEAD 3: the faces (low and tall, left middle right), the doors, the signs
    for kind in ('plaster', 'shutter', 'lit_window', 'stone'):
        for ht in ('low', 'tall'):
            for p in ('left', 'middle', 'right'):
                w, h = FACE_PX[ht]
                img = cut_ground(M['wall_%s_%s_%s' % (kind, ht, p)], w=w, h=h, shave=1)
                A.add('face_%s_%s' % (kind, ht), img, w // 2, h)
        A.newrow()
    for k in ('door_store_open', 'door_shut_barred', 'door_double_iron'):
        A.add(k, cut_ground(M[k], w=T, h=T, shave=1), T // 2, T)
    A.newrow()
    for k in [k for k in M if k.startswith('sign_')]:
        img, _ = cut_prop(M[k], width=34)                              # (the bracket's arm and the board: 34 px, the code sign's board was 28)
        A.add(k, img, img.shape[1] // 2, 0)
    A.newrow()
    # HEAD 4: the Hex's sand; the mountain's rock, its cliff face, the vault door (the Hex's walls and roof drawn on its diagonals isometric -- not cut)
    for i in range(4): ground('hex_sand', 'hex_sand_v%d' % (i + 1))
    for i in range(4): ground('mountain_rock', 'mountain_rock_v%d' % (i + 1))
    A.newrow()
    for k in ('cliff_left', 'cliff_middle', 'cliff_right', 'cliff_vault_door'):
        A.add(k, cut_ground(M[k], w=T, h=64, shave=1), T // 2, 64)
    A.newrow()
    # HEAD 6: the rooms' floors and walls
    for kind in ('plank', 'flagstone', 'earth'):
        for i in range(4): ground('room_floor_' + kind, 'room_floor_%s_v%d' % (kind, i + 1))
    A.newrow()
    for kind in ('plain', 'window', 'fireplace'):
        for p in ('left', 'middle', 'right'):
            w, h = FACE_PX['roomwall']
            A.add('room_wall_' + kind, cut_ground(M['room_wall_%s_%s' % (kind, p)], w=w, h=h, shave=1), w // 2, h)
    A.add('room_doorway_open', cut_ground(M['room_doorway_open'], w=T, h=T, shave=1), T // 2, T)
    A.newrow()
    # HEAD 5 and HEAD 7: the props, each by its footprint's width (PROPW: the drawing's width in game px)
    for k, wpx in PROPS_STREET + PROPS_ROOM:
        fw, fh = M[k][2]
        img, sc = cut_prop(M[k], width=wpx)
        A.add(k.replace('street_', '').replace('room_', 'room_'), img, img.shape[1] // 2, img.shape[0] - max(1, int(round(PROPFOOT.get(k, 0.0) * img.shape[0]))))
    A.write('toptiles_p1', 'deep16/_src/toptiles/ART-111/ (the art desk\'s ART-111, 10-22: Silverton top-down, seven HEADs), cut by tools/toptiles-sheet.py',
            {'dual': dual, 'door': 'roam:silverton'}, check)


# the props' widths in game px (the drawing's own width: a stall across two squares, a crate most of one) and how far up its own height its foot stands
# (a 2 x 2 prop's anchor its footprint's south edge; a tall thing's the foot of its post)
PROPS_STREET = [('street_market_stall', 92), ('street_crate', 34), ('street_barrel', 30), ('street_sacks', 40), ('street_handcart', 70),
                ('street_well', 40), ('street_mine_headframe', 92), ('street_lamp_post', 30), ('street_pine_tree', 96), ('street_bench', 72),
                ('street_hitching_rail', 80), ('street_fountain', 92), ('street_signpost', 34), ('street_notice_board', 80)]
PROPS_ROOM = [('room_counter', 94), ('room_shelves', 94), ('room_grille', 94), ('room_beam_scale', 92), ('room_anvil', 40), ('room_forge', 94),
              ('room_barrel', 32), ('room_sacks', 38), ('room_cloth_rack', 36), ('room_desk', 42), ('room_pew', 94), ('room_lantern_rack', 40),
              ('room_table', 92), ('room_chair', 26), ('room_barber_chair', 34), ('room_bath', 46), ('room_bed', 42), ('room_stable_stall', 94)]
PROPFOOT = {}


# ------------------------------------------------------------------ SILVERTON'S FOUNTAINS (ART-124, 10-29: the cutter seat of 10-29)
# Asked in deep16-art-wanted.md section 28 on Griz's "we'll probably need custom fountain tiles, this looks like spilled waterfall water" (10-28): basins seen straight
# down. In hand: HEAD 3 alone (ART-124_HEAD-3_PAGE-1 to 4, fountains/ART-124/ and its manifest.json): four calm water fills; the water's edge against the stone rim,
# N, E, S, W; its outer corners and its inner corners, NW, NE, SW, SE each -- the art desk's labels, not its manifest's order. HEADs 1 and 2 (the whole fountains, small
# and large) were never delivered. js/topview.js builds a basin of any size from these by quarters (TV.basin).
# The pages are not one scale, and each piece draws its rim another width (the art desk's notes: the inner corners' stone about a third of the tile where the edges'
# is about a quarter, the rims varying by side): each piece is laid out again to one rim a side, RIM below -- the median of every piece's own on that side -- by a
# piecewise stretch along x and along y at the page's size (the stone band to the rim, the water to the rest), then boxed down; its water toned to the four fills'
# by rank (the edges' water came out another shade, a patch at every join), then snapped.
BASINS = [('H3P1', {'1': 'basin_water', '2': 'basin_water', '3': 'basin_water', '4': 'basin_water'}),
          ('H3P2', {'N': 'basin_edge_n', 'E': 'basin_edge_e', 'S': 'basin_edge_s', 'W': 'basin_edge_w'}),
          ('H3P3', {'NW': 'basin_outer_nw', 'NE': 'basin_outer_ne', 'SW': 'basin_outer_sw', 'SE': 'basin_outer_se'}),
          ('H3P4', {'NW': 'basin_inner_nw', 'NE': 'basin_inner_ne', 'SW': 'basin_inner_sw', 'SE': 'basin_inner_se'})]


WATER_K = (4.5, 9)  # a water pixel this far darker than the fills' middle lightness is a ripple, this far lighter a glint (the base 61, the ripples 55, the glints 80)


def stone_of(t):
    """the rim's pale stone, not the water's blue"""
    return t[..., 0] > t[..., 2] + 20


def basin_window(path, box):
    a, bg = page(path)
    x0, y0, x1, y1 = box
    win = a[y0:y1, x0:x1]
    r0, r1, c0, c1 = ground_box(win, bg)
    return win[r0 + SHAVE:r1 - SHAVE, c0 + SHAVE:c1 - SHAVE]


def bands(t, name):
    """the piece's stone in source px: {side: depth} for an edge or an outer corner's sides, or the inner corner's block (its width and height)"""
    st = stone_of(t); H, W = st.shape; out = {}
    def lead(v):                                                        # (the band's end: the last row or column mostly stone in the near 45% -- the tile's dark outline
        hit = np.where(v[:int(len(v) * 0.45)] >= 0.5)[0]                # at its outer border is not stone, and would stop a count from the edge)
        return int(hit.max()) + 1 if len(hit) else 0
    if '_inner_' in name:
        k = name[-2:]; ys = slice(0, H // 2) if k[0] == 'n' else slice(H // 2, H); xs = slice(0, W // 2) if k[1] == 'w' else slice(W // 2, W)
        q = st[ys, xs]; rows, cols = q.mean(1), q.mean(0)                # (the block in its own quarter: its rows and columns mostly stone)
        out['y'] = lead(rows) if k[0] == 'n' else lead(rows[::-1])
        out['x'] = lead(cols) if k[1] == 'w' else lead(cols[::-1])
        return out
    sides = name.split('_')[-1]
    for s in sides:
        if s == 'n': out['n'] = lead(st.mean(1))
        if s == 's': out['s'] = lead(st.mean(1)[::-1])
        if s == 'w': out['w'] = lead(st.mean(0))
        if s == 'e': out['e'] = lead(st.mean(0)[::-1])
    return out


def restretch(t, ax_breaks):
    """t laid out again by a piecewise stretch: ax_breaks = (y breaks, x breaks), each [(source edge, target fraction)] from 0 to the far side"""
    S = 480                                                             # (the target at ten times the tile, sampled nearest, then boxed down)
    def mapping(n_src, br):
        src = np.array([b[0] for b in br], float); dst = np.array([b[1] for b in br], float) * S
        return np.clip(np.interp(np.arange(S) + 0.5, dst, src).astype(int), 0, n_src - 1)
    ys, xs = mapping(t.shape[0], ax_breaks[0]), mapping(t.shape[1], ax_breaks[1])
    return t[ys][:, xs]


WHOLE = {'fountain_small': 96, 'fountain_large': 288, 'fountain_true': 576}   # HEAD 1's size and HEAD 2's (art-wanted section 28): the rim's width at the town's 30-ft squares and at 10 ft; and at true scale, 5 ft (10-29 later: the page draws it 616 across, so cut, not doubled)


def fountain_whole(A):
    """the whole fountain, HEAD 2 PAGE 1 (10-29, the second job: the art desk's H2P1, three takes titled "H2P1 - IDLE VARIATION"; this one the calmest water, the
    fewest bright pixels): a round basin, its rim in two rings, a pedestal and spout in the middle, two frames -- the water still, then its rings moved on. Frame 2
    stands clear on the page; frame 1 touches the page's title box, so it takes frame 2's own outline moved to where the two rims match (only the water differs).
    Each frame boxed down to the rim's width at two sizes -- HEAD 1 never came, so the small is the same drawing -- the alpha cut at a half and snapped; the anchor
    (ax, ay) the drawing's middle (the rim drawn a little wider than tall, seen from just south of overhead)"""
    path = os.path.join(PX.SRC, 'fountains', 'ART-124', 'ART-124_HEAD-2_PAGE-1.png')
    a, bg = page(path)
    H, W = a.shape[:2]
    m = drawn(a, bg)
    m[:, :W // 2] = False                                               # (frame 2, the right half)
    m = ndimage.binary_closing(m, iterations=2)
    lab, n = ndimage.label(m)
    k = 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    m2 = ndimage.binary_fill_holes(lab == k)
    ys, xs = np.nonzero(m2); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rim = m2[y0:y1, x0:x1]; c2 = a[y0:y1, x0:x1].astype(np.float64)
    stone = rim & ~((c2[..., 2] > c2[..., 0] + 60) & (c2[..., 2] > 120))   # (the rings and the pedestal, not the water: where the two frames must agree)
    best = None
    for dx in range(-830, -790):                                        # (the frames' numbers stand 811 px apart)
        for dy in range(-6, 7):
            if x0 + dx < 0 or y0 + dy < 0: continue
            c1 = a[y0 + dy:y1 + dy, x0 + dx:x1 + dx].astype(np.float64)
            err = np.abs(c1 - c2)[stone].mean()
            if best is None or err < best[0]: best = (err, dx, dy)
    err, dx, dy = best
    frames = [a[y0 + dy:y1 + dy, x0 + dx:x1 + dx], a[y0:y1, x0:x1]]
    print('  the whole fountain: %d x %d on the page; frame 1 at %+d,%+d from frame 2 (the rims %.1f apart on average)' % (x1 - x0, y1 - y0, dx, dy, err))
    # (10-29 later: the second frame is its water alone -- the art desk's two frames draw the stone a little differently, and laid one over the other each beat (js/topview.js
    # TV.fountFx) the rims would shimmer; the water is either frame's pool blue, inside the rim)
    blue = lambda c: (c[..., 2] > c[..., 0] + 60) & (c[..., 2] > 120)
    water = ndimage.binary_opening((blue(frames[0].astype(np.int32)) | blue(frames[1].astype(np.int32))) & rim, iterations=1)
    lw, nw = ndimage.label(ndimage.binary_closing(water, iterations=3))
    water &= lw == 1 + int(np.argmax(ndimage.sum(water, lw, range(1, nw + 1))))   # (the pool alone: the rims' bluish specks are not water)
    for name, wpx in WHOLE.items():
        k2 = wpx / float(x1 - x0); h2 = int(round((y1 - y0) * k2))
        for i, f in enumerate(frames):
            rgb, al = box_down(f, wpx, h2, (rim if i == 0 else water).astype(np.float64))
            out = np.zeros((h2, wpx, 4), np.uint8); solid = al >= 0.5
            out[solid, :3] = snap(rgb)[solid]; out[solid, 3] = 255
            A.add(name, out, wpx // 2, h2 // 2)
        A.newrow()


def fountains(check=False):
    d = os.path.join(PX.SRC, 'fountains', 'ART-124')
    man = json.load(open(os.path.join(d, 'manifest.json'), encoding='utf-8'))
    raw = {}                                                            # name -> [source window, ...]
    for pg, labels in BASINS:
        e = [x for x in man if x['page'] == pg][0]
        for it in e['entries']:
            raw.setdefault(labels[it['label']], []).append(basin_window(os.path.join(d, os.path.basename(e['file'])), it['source_window_xyxy']))
    # the rim a side: the median of the pieces' own, as a fraction of the tile
    meas = {n: [bands(t, n) for t in ts] for n, ts in raw.items() if n != 'basin_water'}
    frac = {}
    for side, ax in (('n', 0), ('s', 0), ('w', 1), ('e', 1)):
        fs = [b[side] / float(t.shape[ax]) for n, ts in raw.items() if n != 'basin_water' and '_inner_' not in n for t, b in zip(ts, meas[n]) if side in b]
        frac[side] = round(T * float(np.median(fs))) / float(T)
    print('  basin rims (px of %d): N %d, E %d, S %d, W %d' % (T, *[round(frac[s] * T) for s in 'nesw']))
    tiles = {}
    for n, ts in raw.items():
        for t, b in zip(ts, meas.get(n, [{}] * len(ts))):
            H, W = t.shape[:2]
            yb, xb = [(0, 0)], [(0, 0)]
            if '_inner_' in n:                                          # (the block: as wide as the rim beside it, as tall as the rim above or below)
                k = n[-2:]
                if k[0] == 'n': yb.append((b['y'], frac['n']))
                else: yb.append((H - b['y'], 1 - frac['s']))
                if k[1] == 'w': xb.append((b['x'], frac['w']))
                else: xb.append((W - b['x'], 1 - frac['e']))
            else:
                if 'n' in b: yb.append((b['n'], frac['n']))
                if 's' in b: yb.append((H - b['s'], 1 - frac['s']))
                if 'w' in b: xb.append((b['w'], frac['w']))
                if 'e' in b: xb.append((W - b['e'], 1 - frac['e']))
            yb.append((H, 1)); xb.append((W, 1))
            big = restretch(t, (yb, xb))
            box, _ = box_down(big, T, T)
            near = big[5::10, 5::10].astype(np.float64)                 # (each target pixel's middle source pixel: the water's ripples are a source pixel or two wide)
            stone = stone_of(box)
            tiles.setdefault(n, []).append((np.where(stone[..., None], box, near), stone))
    # the water toned to the fills': each piece's water moved by the difference of its middle colour from the four fills' (not by rank: the rim's shadow on the
    # water along a corner's two sides would take all of the darkest ranks, and the ripples in it none)
    fillpx = np.concatenate([x[~s] for x, s in tiles['basin_water']])
    for n, xs in tiles.items():
        if n == 'basin_water': continue
        for x, s in xs:
            x[~s] = np.clip(x[~s] + (np.median(fillpx, 0) - np.median(x[~s], 0)), 0, 255)
    # the water in three of the 64: the art desk's calm teal, its darker ripples and its few light glints are a few steps apart (base 12,76,116, the ripples
    # 12,68,100, the glints 20,104,116) and all snap to one colour, a flat sheet. Each water pixel is the ripple, the base or the glint by its lightness
    # against the fills' (WATER_K), the base the snap of the fills' middle, the ripple and the glint the palette's nearest colours darker and lighter than it
    lum = lambda c: np.asarray(c, np.float64) @ LUM
    mid = np.median(lum(fillpx))
    pal = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for r in json.load(open(os.path.join(ROOT, 'deep16', 'palette.json')))['ramps'].values() for h in r], np.float64)
    base = snap(np.median(fillpx, 0).reshape(1, 1, 3)).reshape(3).astype(np.float64)
    def nearest(c, keep):
        ok = pal[keep(lum(pal))]
        return ok[np.argmin(((ok - c) ** 2).sum(-1))]
    dark_c = fillpx[lum(fillpx) < mid - WATER_K[0]].mean(0); light_c = fillpx[lum(fillpx) > mid + WATER_K[1]].mean(0)
    ripple, glint = nearest(dark_c, lambda L: L < lum(base) - 4), nearest(light_c, lambda L: L > lum(base) + 4)
    print('  basin water: base %s, ripple %s, glint %s (of the 64)' % (tuple(int(v) for v in base), tuple(int(v) for v in ripple), tuple(int(v) for v in glint)))
    A = Atlas(48 * 24)                                                  # (two of the true-scale fountain a row)
    fountain_whole(A)
    for n in ['basin_water'] + [v for pg, lab in BASINS[1:] for v in lab.values()]:
        for x, s in tiles[n]:
            out = np.zeros((T, T, 4), dtype=np.uint8); out[..., :3] = snap(x); out[..., 3] = 255
            L = lum(x)
            out[~s & (L < mid - WATER_K[0]), :3] = ripple; out[~s & (L > mid + WATER_K[1]), :3] = glint
            out[~s & (L >= mid - WATER_K[0]) & (L <= mid + WATER_K[1]), :3] = base
            out[ndimage.binary_dilation(s) & ~s & (L > mid + WATER_K[1]), :3] = ripple   # (the water's pixel against the stone: the rim's shadow, not a glint -- the stone's blend lit it)
            A.add(n, out, T // 2, T)
        if n in ('basin_water', 'basin_edge_w', 'basin_outer_se'): A.newrow()
    A.write('fountains_p1', 'deep16/_src/fountains/ART-124/ (the art desk\'s ART-124 HEAD 3, 10-28: the fountains\' basin water, its edges and corners against the rim), cut by tools/toptiles-sheet.py fountains',
            {'door': 'roam:silverton', 'rim': {s: round(frac[s] * T) for s in 'nesw'}}, check)


if __name__ == '__main__':
    if 'fountains' in sys.argv[1:]:
        fountains('check' in sys.argv[1:])
    else:
        silverton('check' in sys.argv[1:])
