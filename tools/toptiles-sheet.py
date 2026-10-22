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


if __name__ == '__main__':
    silverton('check' in sys.argv[1:])
