"""DEEP16 pipeline 2 (generated art): the Gallows Gobbler (a Huge mutant turkey, Challenge 5) -> deep16/art/gallowsgobbler_p1, all eight facings.

    python tools/gallowsgobbler-sheet.py            (writes deep16/art/gallowsgobbler_p1.png/.json)
    python tools/gallowsgobbler-sheet.py check      (also deep16/art-src/gallowsgobbler/: a review sheet a view, every row at 2x, the anchor marked, and the line-up)

Drawn by the art desk (2026-11-26-GALLOWS-GOBBLER-COMBAT, in deep16/_src/gallowsgobbler/): five views (S, SE, E, NE rear, N; SW W NW the mirrors, RULED 10-14) of eight
actions, a strip each, its cells cut at combat-frame-map.csv's horizontal_cut_edges_px. Rows: idle 4, walk 8 <- Strut, lefttalon 6, righttalon 6 (release 3), gobble 6
(release 3), flinch 4, hurt 6 <- Fall, prone 1. THE TALONS SWAP ON THE MIRRORS (the art desk: mirrored facings swap left/right action rows): SW W NW's lefttalon is the
mirror of SE E NE's righttalon and the reverse.
  * KEY: each cell's navy by a flood from the cell's own border (TOL), enclosed navy over HOLE px keyed too (the space between the feet); every piece of 12 px or more stays.
  * SCALE: each view's idle (median of its frames) crown to feet to TALL; every other strip by its frame 1's height to its view's idle; prone by its width to its fall 6.
  * PLACE: y by each frame's lowest pixel; x by frame 1's ground contact (middle of its lowest 8% of rows) in the cell, every frame of the strip keeping its drawn place
    relative to that same cell x. Prone sits under fall 6's middle.
"""
import csv, json, os, sys
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'gallowsgobbler', '2026-11-26-GALLOWS-GOBBLER-COMBAT')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'gallowsgobbler', os.path.basename(FOLDER))
NAME = 'gallowsgobbler_p1'
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ROW = {'idle': 'idle', 'strut': 'walk', 'left-talon': 'lefttalon', 'right-talon': 'righttalon', 'gobble': 'gobble', 'flinch': 'flinch', 'fall': 'hurt', 'prone': 'prone'}
ORDER = ['idle', 'walk', 'lefttalon', 'righttalon', 'gobble', 'flinch', 'hurt', 'prone']
SWAP = {'lefttalon': 'righttalon', 'righttalon': 'lefttalon'}
FPS = {'idle': 6, 'walk': 8, 'lefttalon': 10, 'righttalon': 10, 'gobble': 8, 'flinch': 12, 'hurt': 8, 'prone': 4}
EXTRA = {'lefttalon': {'release': 3}, 'righttalon': {'release': 3}, 'gobble': {'release': 3}}   # (the art desk's events: drawing 4, index 3)
TALL = 160              # (tail-top to feet: a Huge body on a 3 x 3 footprint; the stone giant 137, the frost giant 153 -- 128 at the cut, raised to 160 by the desk on its look in the engine, 11-26: at 128 it stood under two tiles wide on its three)
TOL, HOLE, MINPIECE = 22, 600, 12
AVOID = []
SOURCE = ('drawn by the art desk (2026-11-26 GALLOWS-GOBBLER-COMBAT: five views of eight actions), cut by tools/gallowsgobbler-sheet.py (11-26): each view\'s idle to 128 px, '
          'each strip by its frame 1, x by frame 1\'s ground contact; SW W NW mirrored with the talon rows swapped')


def read_cell(a, x0, x1):
    """(rgb cell, mask, bbox x0 y0 x1 y1 in cell coords) of one cell of a strip array"""
    c = a[:, x0:x1]
    bd = np.concatenate([c[:3].reshape(-1, 3), c[-3:].reshape(-1, 3), c[:, :3].reshape(-1, 3), c[:, -3:].reshape(-1, 3)])
    near = np.linalg.norm(c - np.median(bd, 0), axis=2) < TOL
    lab, _ = ndimage.label(near)
    out = np.isin(lab, list(set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}))
    hl, hn = ndimage.label(near & ~out)
    if hn:
        hs = ndimage.sum(near & ~out, hl, range(1, hn + 1)); out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fg = ~out
    fl, fn = ndimage.label(fg, np.ones((3, 3)))
    if fn:
        fs = ndimage.sum(fg, fl, range(1, fn + 1)); fg = np.isin(fl, [i + 1 for i, s in enumerate(fs) if s >= MINPIECE])
    ys, xs = np.where(fg)
    if not len(ys):
        raise SystemExit('empty cell')
    return c, fg, int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def pages():
    """{view: {action: [cell]}} by the frame map"""
    out = {}
    for r in csv.DictReader(open(os.path.join(FOLDER, 'combat-frame-map.csv'), encoding='utf-8-sig')):
        a = np.asarray(Image.open(os.path.join(FOLDER, *r['source_path'].split('/'))).convert('RGB')).astype(np.float32)
        n = int(r['requested_frames'])
        edges = [int(e) for e in r['horizontal_cut_edges_px'].split(',')] if r['horizontal_cut_edges_px'] else [0, a.shape[1]]
        if len(edges) - 1 != n:
            raise SystemExit('%s %s: %d cells, %d requested' % (r['facing'], r['action'], len(edges) - 1, n))
        out.setdefault(r['facing'], {})[r['action']] = [read_cell(a, edges[i], edges[i + 1]) for i in range(n)]
    return out


def to1x(a, m, k):
    h, w = m.shape
    nw, nh = max(1, int(round(w * k))), max(1, int(round(h * k)))
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = a * m[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    sn = pix.snap(c, AVOID)
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = sn[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = pix.OUTLINE; o[e & ~s2, 3] = 255
    return o


def contact_x(fr):
    """x (cell coords) of a frame's ground contact: the middle of its lowest 8% of rows"""
    c, fg, x0, y0, x1, y1 = fr
    lo = y1 - max(1, int(round((y1 - y0) * 0.08)))
    return float(np.mean(np.where(fg[lo:y1])[1]))


def cut():
    """{row: {view: [(RGBA, x, y) from the anchor]}}, notes"""
    P = pages()
    rows, notes = {r: {} for r in ORDER}, []
    for v in VIEWS:
        pg = P[v]
        ih = float(np.median([f[5] - f[3] for f in pg['idle']]))
        kv = TALL / ih
        k = {'idle': kv}
        for act in pg:
            if act in ('idle', 'prone'):
                continue
            k[act] = kv * ih / float(pg[act][0][5] - pg[act][0][3])
        f6 = pg['fall'][-1]
        k['prone'] = k['fall'] * (f6[4] - f6[2]) / float(pg['prone'][0][4] - pg['prone'][0][2])
        notes.append('%s: idle %d src px tall, k %s' % (v, ih, ', '.join('%s %.4f' % (q, k[q]) for q in ROW if q in k)))
        fall_mid = None
        for act in ['idle', 'strut', 'left-talon', 'right-talon', 'gobble', 'flinch', 'fall', 'prone']:
            fr = pg[act]; row = ROW[act]; kk = k[act]; out = []
            cx1 = contact_x(fr[0])
            for i, f in enumerate(fr):
                c, fg, x0, y0, x1, y1 = f
                o = to1x(c[y0:y1, x0:x1], fg[y0:y1, x0:x1], kk)
                ys = np.where(o[..., 3] > 0)[0]
                ox = int(round((x0 - cx1) * kk)) - 1                    # (the 1 px outline pad)
                if act == 'prone':
                    ox = int(round(fall_mid - o.shape[1] / 2.0))
                out.append((o, ox, -int(ys[-1])))
            if act == 'fall':
                o, ox, _ = out[-1]; fall_mid = ox + o.shape[1] / 2.0
            rows[row][v] = out
    return rows, notes


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows):
    up = max(-y for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    dn = max(y + o.shape[0] for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    fh, ay = up + dn, up
    geo, drawn = {}, {}
    for r in ORDER:
        grp = [r] + ([SWAP[r]] if r in SWAP else [])
        hw = max(max(-x, x + o.shape[1]) for g in grp for v in VIEWS for o, x, y in rows[g][v]) + 2
        geo[r] = (int(2 * hw), int(fh), int(hw), int(ay))
        fw = 2 * hw
        drawn[r] = {}
        for v in VIEWS:
            fs = []
            for o, x, y in rows[r][v]:
                c = np.zeros((fh, fw, 4), np.uint8)
                c[ay + y:ay + y + o.shape[0], hw + x:hw + x + o.shape[1]] = o
                fs.append(c)
            drawn[r][FACE[v]] = fs
    cells = {}
    for r in ORDER:
        src = SWAP.get(r, r)
        cells[r] = [drawn[r][f] if f in drawn[r] else [mirror(c) for c in drawn[src][MIRROR[f]]] for f in range(8)]
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
    json.dump({'image': 'art/%s.png' % NAME, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': 'Gallows Gobbler', 'source': SOURCE, 'anims': meta},
              open(os.path.join(pix.ART, NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in ORDER)))


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


def lineup(cells, geo, folder, refs=('ogre_p1', 'stonegiant_p1', 'broodmother_p1', 'shieldguardian_p1'), scale=2, bg=(14, 20, 48)):
    items = []
    for nm in refs:
        j = json.load(open(os.path.join(pix.ART, nm + '.json'))); an = j['anims']['idle']
        sh = Image.open(os.path.join(pix.ART, os.path.basename(j['image']))).convert('RGBA')
        items.append((sh.crop((0, an['y'] + 7 * an['fh'], an['fw'], an['y'] + 8 * an['fh'])), an['ax'], an['ay']))
    fw, fh, ax, ay = geo['idle']
    items.append((Image.fromarray(cells['idle'][7][0], 'RGBA'), ax, ay))
    up = max(i[2] for i in items); dn = max(i[0].height - i[2] for i in items)
    W = sum(i[0].width for i in items) + 10 * len(items)
    im = Image.new('RGB', (W, up + dn + 4), bg); x = 5
    for p, a, b in items:
        im.paste(p, (x, up - b), p); x += p.width + 10
    im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(folder, NAME + '-lineup.png'))


if __name__ == '__main__':
    rows, notes = cut()
    for nt in notes:
        print('  ' + nt)
    cells, geo = lay(rows)
    write(cells, geo)
    if 'check' in sys.argv:
        fo = os.path.join(ROOT, 'deep16', 'art-src', 'gallowsgobbler')
        review(cells, geo, fo)
        lineup(cells, geo, fo)
