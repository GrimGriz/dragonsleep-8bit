"""DEEP16 pipeline 2 (generated art): the Cranberry Can, a Small living tin can of cranberry sauce -> deep16/art/cranberrycan_p1, all eight facings,
and its sauce floor tile -> deep16/art/cranberrysauce_tile.png.

    python tools/cranberrycan-sheet.py            (writes deep16/art/cranberrycan_p1.png/.json and cranberrysauce_tile.png)
    python tools/cranberrycan-sheet.py check      (also deep16/art-src/cranberrycan/: a review sheet a view, every row at 2x, the anchor marked, and the line-up)

Drawn by the art desk (2026-11-26-CRANBERRY-CAN-COMBAT: five views S, SE, E, rear NE, N of seven actions, a strip each, plus the berry and the sauce tile; SW W NW the
mirrors of SE E NE, RULED 10-14). Read by combat-frame-map.csv: each row is one strip PNG on a flat dark navy and horizontal_cut_edges_px are its cells' x edges.

Each cell: the navy keyed by a flood from the cell's own border (enclosed navy over HOLE px keyed too); EVERY foreground piece of 12 px or more stays (steam, the
poured sauce, a berry belong to the frame).
  * SCALE: each view's idle (the median of its four, crown of the open lid to the jelly feet) to TALL; every other strip by its frame 1's height to its view's idle
    (every strip opens standing); prone by its width to its view's hurt (Fall) frame 6. The berry by the SE scale, to at least 5 px across.
  * PLACE: y, each frame's lowest opaque pixel is the ground; x, frame 1's ground contact (the middle of its lowest 8% of rows) is the strip's x, every frame keeps
    its drawn place relative to it (a lean or a lunge stays in); the berry by its centre of mass, both ways, the same picture in all eight facings.
Rows (the engine's names): idle 4; walk 8 <- waddle; shot 6 (Cranberry Shot, the berry leaves on 4, release 3); spill 6 (Sauce Spill, the pour on 4, release 3);
flinch 4; hurt 6 <- fall; prone 1; berry 1 (the missile alone).
"""
import csv, json, os, sys
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'cranberrycan', '2026-11-26-CRANBERRY-CAN-COMBAT')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'cranberrycan', os.path.basename(FOLDER))
NAME = 'cranberrycan_p1'
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ROW = {'idle': 'idle', 'waddle': 'walk', 'shot': 'shot', 'spill': 'spill', 'flinch': 'flinch', 'fall': 'hurt', 'prone': 'prone'}
ORDER = ['idle', 'walk', 'shot', 'spill', 'flinch', 'hurt', 'prone', 'berry']
FPS = {'idle': 6, 'walk': 8, 'shot': 10, 'spill': 8, 'flinch': 12, 'hurt': 8, 'prone': 4, 'berry': 4}
EXTRA = {'shot': {'release': 3}, 'spill': {'release': 3}}   # (the art desk's events: drawing 4, index 3)
TALL = 30               # (crown of the open lid to the jelly feet: a Small body, about 2.5 ft; the grid's Medium heroes stand 47 to 54 px)
TOL, HOLE, PIECE, BERRY_PX = 22, 600, 12, 7
SOURCE = ('drawn by the art desk (2026-11-26-CRANBERRY-CAN-COMBAT: five views of seven actions, the berry and the sauce tile), cut by tools/cranberrycan-sheet.py '
          '(11-26): each view\'s idle to 30 px, each strip by its frame 1, every frame on its own lowest pixel with frame 1\'s ground contact as the strip\'s x; '
          'SW W NW mirrored; the berry alone, one picture for all eight facings')


def key_cell(a):
    """foreground mask of an rgb float array: navy flooded from the border, enclosed navy over HOLE px, pieces under PIECE px dropped"""
    bd = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
    near = np.linalg.norm(a - np.median(bd, 0), axis=2) < TOL
    lab, _ = ndimage.label(near)
    out = np.isin(lab, list(set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}))
    hl, hn = ndimage.label(near & ~out)
    if hn:
        hs = ndimage.sum(near & ~out, hl, range(1, hn + 1)); out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fg = ~out
    fl, fn = ndimage.label(fg, np.ones((3, 3), bool))
    if fn:
        sz = ndimage.sum(fg, fl, range(1, fn + 1)); fg = np.isin(fl, [i + 1 for i, s in enumerate(sz) if s >= PIECE])
    return fg


def read_cells(path, edges):
    """[(rgb of the cell, fg mask, bbox x0, y0, bbox mask)] -- one per cell"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    if not edges:
        edges = [0, a.shape[1]]
    out = []
    for x0, x1 in zip(edges[:-1], edges[1:]):
        c = a[:, x0:x1]
        fg = key_cell(c)
        ys, xs = np.where(fg)
        if not len(ys):
            raise SystemExit('%s: an empty cell %d..%d' % (path, x0, x1))
        bx0, by0 = xs.min(), ys.min()
        out.append((c, fg, int(bx0), int(by0), fg[by0:ys.max() + 1, bx0:xs.max() + 1]))
    return out


def contact_x(fg):
    """x (cell coordinates) of the middle of the lowest 8% of the opaque rows"""
    ys = np.where(fg.any(1))[0]
    lo = ys[-1] - 0.08 * (ys[-1] - ys[0])
    xs = np.where(fg[int(np.ceil(lo)):].any(0))[0]
    return (xs.min() + xs.max()) / 2.0


def to1x(a, m, x0, y0, k):
    h, w = m.shape
    nw, nh = max(1, int(round(w * k))), max(1, int(round(h * k)))
    rgb = a[y0:y0 + h, x0:x0 + w]
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb * m[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    sn = pix.snap(c, [])
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = sn[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = pix.OUTLINE; o[e & ~s2, 3] = 255
    return o


def pages():
    """{view: {action: [cells]}}, {action: requested}, the FX berry's cells"""
    out, req, fx = {}, {}, None
    for r in csv.DictReader(open(os.path.join(FOLDER, 'combat-frame-map.csv'), encoding='utf-8-sig')):
        p = os.path.join(FOLDER, *r['source_path'].split('/'))
        edges = [int(v) for v in r['horizontal_cut_edges_px'].split(',')] if r['horizontal_cut_edges_px'].strip() else None
        if r['facing'] == 'FX':
            if r['action'] == 'berry':
                fx = read_cells(p, edges)
            continue
        cells = read_cells(p, edges)
        if len(cells) != int(r['requested_frames']):
            raise SystemExit('%s %s: %d cells, the frame map wants %s' % (r['facing'], r['action'], len(cells), r['requested_frames']))
        out.setdefault(r['facing'], {})[r['action']] = cells
    return out, fx


def place(o, dx, kx=0):
    al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
    return (o, dx, -int(ys[-1]))


def cut():
    """{row: {view: [(RGBA, x, y) from the anchor]}}, notes, the berry (RGBA, x, y)"""
    P, fx = pages()
    rows, notes = {r: {} for r in ORDER}, []
    kse = None
    for v in VIEWS:
        pg = P[v]
        ih = float(np.median([c[4].shape[0] for c in pg['idle']]))
        kv = TALL / ih
        if v == 'SE':
            kse = kv
        k = {'idle': kv}
        for act in pg:
            if act in ('idle', 'prone'):
                continue
            k[act] = kv * ih / float(pg[act][0][4].shape[0])
        k['prone'] = k['fall'] * pg['fall'][-1][4].shape[1] / float(pg['prone'][0][4].shape[1])
        notes.append('%s: idle %d src px tall, k %s' % (v, ih, ', '.join('%s %.4f' % (q, k[q]) for q in ROW if q in k)))
        for act, cells in pg.items():
            row = ROW[act]; out = []
            cx0 = contact_x(cells[0][1])
            for a, fg, bx, by, m in cells:
                o = to1x(a, m, bx, by, k[act])
                al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
                out.append((o, int(round((bx - cx0) * k[act])) - 1, -int(ys[-1])))
            rows[row][v] = out
    a, fg, bx, by, m = fx[0]
    ys, xs = np.where(fg)
    cy0, cx0 = ndimage.center_of_mass(fg)
    k = kse
    o = to1x(a, m, bx, by, k)
    al = o[..., 3] > 0; ax_ = np.where(al.any(0))[0]
    across = ax_.max() - ax_.min() + 1 - 2
    # (the desk, 11-26: at the can's scale the FX page's berry came out 22 px, the can's own width -- the page draws it far larger than the shot's; one whole cranberry
    # in the air reads at BERRY_PX across, the berry the shot strip's frame 5 flings)
    k = k * BERRY_PX / max(across, 1); o = to1x(a, m, bx, by, k)
    al = o[..., 3] > 0
    cy, cx = ndimage.center_of_mass(al)
    notes.append('berry: %.1f px across at the SE scale %.4f (src %d px), k used %.4f -> %dx%d' % (
        across, kse, m.shape[1], k, o.shape[1], o.shape[0]))
    berry = (o, -int(round(cx)), -int(round(cy)))
    for v in VIEWS:
        rows['berry'][v] = [berry]
    return rows, notes


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows):
    up = max(-y for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    dn = max(y + o.shape[0] for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    fh, ay = up + dn, up
    cells, geo = {}, {}
    for r in ORDER:
        hw = max(max(-x, x + o.shape[1]) for v in VIEWS for o, x, y in rows[r][v]) + 2
        fw = 2 * hw
        drawn = {}
        for v in VIEWS:
            fs = []
            for o, x, y in rows[r][v]:
                c = np.zeros((fh, fw, 4), np.uint8)
                c[ay + y:ay + y + o.shape[0], hw + x:hw + x + o.shape[1]] = o
                fs.append(c)
            drawn[FACE[v]] = fs
        if r == 'berry':                                              # (the one picture in all eight facings, not mirrored)
            cells[r] = [drawn[7] for f in range(8)]
        else:
            cells[r] = [drawn[f] if f in drawn else [mirror(c) for c in drawn[MIRROR[f]]] for f in range(8)]
        geo[r] = (int(fw), int(fh), int(hw), int(ay))
    return cells, geo


def write(cells, geo):
    wide = max(len(cells[r][0]) * geo[r][0] for r in ORDER)
    H = sum(8 * geo[r][1] for r in ORDER)
    sheet = np.zeros((H, wide, 4), np.uint8)
    meta, y = {}, 0
    for r in ORDER:
        fw, fh, ax, ay = geo[r]
        meta[r] = {'y': y, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(cells[r][0]), 'fps': FPS[r]}
        meta[r].update(EXTRA.get(r, {}))
        for f in range(8):
            for i, c in enumerate(cells[r][f]):
                sheet[y + f * fh:y + (f + 1) * fh, i * fw:(i + 1) * fw] = c
        y += 8 * fh
    fw0, fh0, ax0, ay0 = geo['idle']
    top = pix.top_of(cells['idle'][0] + cells['idle'][7], ay0)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, NAME + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % NAME, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': 'Cranberry Can', 'source': SOURCE, 'anims': meta},
              open(os.path.join(pix.ART, NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in ORDER)))


def tile():
    """the sauce floor tile: navy keyed to nothing, the drawing's own square boxed to 64 x 32, snapped to the 64, masked to one iso floor diamond"""
    a = np.asarray(Image.open(os.path.join(FOLDER, 'actions', 'FX', 'sauce-tile.png')).convert('RGB')).astype(np.float32)
    bd = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
    fg = np.linalg.norm(a - np.median(bd, 0), axis=2) >= TOL
    fl, fn = ndimage.label(fg, np.ones((3, 3), bool))
    sz = ndimage.sum(fg, fl, range(1, fn + 1)); fg = np.isin(fl, [i + 1 for i, s in enumerate(sz) if s >= PIECE])
    ys, xs = np.where(fg)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    m = fg[y0:y1, x0:x1]; rgb = a[y0:y1, x0:x1]
    W, Hh = 64, 32
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((W, Hh), Image.BOX)).astype(np.float32) / 255
    pm = rgb * m[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((W, Hh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    sn = pix.snap(c, [])
    yy, xx = np.mgrid[0:Hh, 0:W]
    diamond = np.abs(xx + 0.5 - 32) / 32 + np.abs(yy + 0.5 - 16) / 16 <= 1
    solid = (al >= 0.5) & diamond
    o = np.zeros((Hh, W, 4), np.uint8); o[solid, :3] = sn[solid]; o[solid, 3] = 255
    Image.fromarray(o, 'RGBA').save(os.path.join(pix.ART, 'cranberrysauce_tile.png'), optimize=True)
    print('  cranberrysauce_tile.png: art box %dx%d src px -> 64x32, %d of %d diamond px covered' % (x1 - x0, y1 - y0, solid.sum(), diamond.sum()))
    return o


def review(cells, geo, folder, scale=2, bg=(14, 20, 48)):
    os.makedirs(folder, exist_ok=True)
    for f, nm in [(7, 'SE'), (5, 'NE'), (0, 'S'), (6, 'E'), (4, 'N'), (1, 'SW')]:
        W = max(len(cells[r][f]) * geo[r][0] for r in ORDER); H = sum(geo[r][1] for r in ORDER)
        im = Image.new('RGB', (W, H), bg); y = 0
        for r in ORDER:
            fw, fh, ax, ay = geo[r]
            for i, c in enumerate(cells[r][f]):
                p = Image.fromarray(c, 'RGBA'); im.paste(p, (i * fw, y), p)
                im.putpixel((i * fw + ax, y + ay), (255, 0, 255))
            y += fh
        im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(folder, '%s-review-%s.png' % (NAME, nm)))
    print('  review: ' + folder)


def lineup(cells, geo, folder, refs=('amara_p2', 'brann_p2', 'goblin_p2'), scale=2, bg=(14, 20, 48)):
    """the can's SE idle frame 1 beside the SE idle frame 0 of the reference sheets, on one ground line"""
    figs = []
    for n in refs:
        j = json.load(open(os.path.join(pix.ART, n + '.json'), encoding='utf-8')); an = j['anims']['idle']
        sh = Image.open(os.path.join(pix.ART, n + '.png')).convert('RGBA')
        figs.append((n, sh.crop((0, an['y'] + 7 * an['fh'], an['fw'], an['y'] + 8 * an['fh'])), an['ax'], an['ay']))
    fw, fh, ax, ay = geo['idle']
    figs.append(('can', Image.fromarray(cells['idle'][7][0], 'RGBA'), ax, ay))
    up = max(f[3] for f in figs) + 4; dn = max(f[1].height - f[3] for f in figs) + 4
    W = sum(f[1].width for f in figs) + 8 * (len(figs) + 1)
    im = Image.new('RGB', (W, up + dn), bg); x = 8
    for n, p, a_, y_ in figs:
        im.paste(p, (x, up - y_), p); x += p.width + 8
    for i in range(W):
        im.putpixel((i, up), (255, 0, 255)) if i % 4 == 0 else None
    im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(folder, 'cranberrycan-lineup.png'))
    print('  lineup: %s (left to right %s)' % (os.path.join(folder, 'cranberrycan-lineup.png'), ', '.join(f[0] for f in figs)))


if __name__ == '__main__':
    rows, notes = cut()
    for nt in notes:
        print('  ' + nt)
    cells, geo = lay(rows)
    write(cells, geo)
    tile()
    if 'check' in sys.argv:
        folder = os.path.join(ROOT, 'deep16', 'art-src', 'cranberrycan')
        review(cells, geo, folder)
        lineup(cells, geo, folder)
