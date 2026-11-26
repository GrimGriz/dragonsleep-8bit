"""DEEP16 pipeline 2 (generated art): the Jacket Bruiser, a Large baked-potato brute that splits into a mound of mash
-> deep16/art/jacketbruiser_p1 (the baked form) and deep16/art/jacketbruiser_p2 (the mashed form), all eight facings, both from one script.

    python tools/jacketbruiser-sheet.py            (writes deep16/art/jacketbruiser_p1/_p2 .png/.json)
    python tools/jacketbruiser-sheet.py check      (also deep16/art-src/jacketbruiser/: a review sheet a view a form, every row at 2x, the anchor marked, and the line-up)

Drawn by the art desk (2026-11-26-JACKET-BRUISER-COMBAT: "Lock both forms together"), cut 11-26 by a cutter seat. The source is combat-frame-map.csv: five views
(S, SE, E, rear NE, N; SW W NW the mirrors of SE E NE, RULED 10-14), each action a strip (actions/<view>/<action>.png) on a flat dark navy, its cells' x edges in the
map's horizontal_cut_edges_px; mashed-prone is one final-fall crop; actions/FX/chunk.png the tumbling chunk, four cells.

  * KEY: each cell's navy flooded from the cell's own border (its median colour, TOL), enclosed navy over HOLE px keyed too; EVERY piece of 12 px or more stays
    (steam, a puddle, a flung chunk). A strip whose cell count is not its requested frames stops the run.
  * SCALE: each view's baked idle (median of its frames, crown to feet) to TALL (a Large body, squat); every baked strip and the split by its frame 1's height to that;
    every mash strip by frame 1's base width (the widest row in its lowest 40%) to the base width of that view's split frame 6 (as scaled); prone by its width to the
    view's fall 6; the chunk one scale, the mash's SE idle scale.
  * PLACE: y: the lowest opaque pixel is the ground. x: frame 1's ground contact (the middle of its lowest 8% of rows) in its cell is the strip's x; every frame keeps
    its drawn place against that, so a lunge stays and nothing slides. The chunk by its centre of mass, both ways, the same picture in all eight facings.
Rows (the engine's names) -- p1: idle 4, walk 8, punch 6 (release 3), engulf 6 (release 3, the jacket closes on 4), hold 4, flinch 4, split 6;
p2: idle 4, walk 6 (the slide), hurl 6 (release 3), flinch 4, hurt 6 (the fall), prone 1, chunk 4.
"""
import csv, json, os, sys
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'jacketbruiser', '2026-11-26-JACKET-BRUISER-COMBAT')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'jacketbruiser', os.path.basename(FOLDER))
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
# (frame-map action) -> (sheet, engine row)
ROW = {'baked-idle': ('p1', 'idle'), 'baked-walk': ('p1', 'walk'), 'baked-punch': ('p1', 'punch'), 'baked-engulf': ('p1', 'engulf'), 'baked-hold': ('p1', 'hold'),
       'baked-flinch': ('p1', 'flinch'), 'split-jacket': ('p1', 'split'),
       'mashed-idle': ('p2', 'idle'), 'mashed-slide': ('p2', 'walk'), 'mashed-hurl': ('p2', 'hurl'), 'mashed-flinch': ('p2', 'flinch'), 'mashed-fall': ('p2', 'hurt'),
       'mashed-prone': ('p2', 'prone'), 'chunk': ('p2', 'chunk')}
ORDER = {'p1': ['idle', 'walk', 'punch', 'engulf', 'hold', 'flinch', 'split'], 'p2': ['idle', 'walk', 'hurl', 'flinch', 'hurt', 'prone', 'chunk']}
NAMES = {'p1': ('jacketbruiser_p1', 'Jacket Bruiser'), 'p2': ('jacketbruiser_p2', 'Jacket Bruiser (mashed)')}
FPS = {'p1': {'idle': 6, 'walk': 8, 'punch': 10, 'engulf': 8, 'hold': 6, 'flinch': 12, 'split': 8},
       'p2': {'idle': 6, 'walk': 8, 'hurl': 10, 'flinch': 12, 'hurt': 8, 'prone': 4, 'chunk': 12}}
EXTRA = {'p1': {'punch': {'release': 3}, 'engulf': {'release': 3}}, 'p2': {'hurl': {'release': 3}}}   # (the art desk's events: drawing 4, index 3)
FXROWS = {'chunk'}
CHUNK_PX = 16             # (the thrown chunk across its first frame: a hot fistful, the mash some 60 px wide -- the desk, 11-26)
TALL = 64               # (crown to feet of the baked idle: a Large body, squat, on a 2 x 2 footprint; the owlbear 54, the ogre 74, the troll 75)
TOL, HOLE, MINPIECE = 22, 600, 12
AVOID = []
SOURCE = ('drawn by the art desk (JACKET-BRUISER-COMBAT, 11-26: five views of the baked and mashed actions, split-jacket, mashed-prone and the FX chunk, "lock both forms '
          'together"), cut by tools/jacketbruiser-sheet.py (11-26): each view\'s baked idle to 64 px, baked strips by their frame 1\'s height, the mash by its base width to the '
          'split\'s last frame, placed on the ground by frame 1\'s contact; SW W NW mirrored')


def read(path, edges):
    """[(mask, x0, y0, rgb page, cell x edge)] -- the cells of a strip; mask the bbox-cropped foreground, x0 the bbox's left in the cell, y0 its top in the page"""
    page = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    if edges is None:
        edges = [0, page.shape[1]]
    out = []
    for i in range(len(edges) - 1):
        a = page[:, edges[i]:edges[i + 1]]
        bd = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
        near = np.linalg.norm(a - np.median(bd, 0), axis=2) < TOL
        lab, _ = ndimage.label(near)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
        hl, hn = ndimage.label(near & ~bg)
        if hn:
            hs = ndimage.sum(near & ~bg, hl, range(1, hn + 1)); bg |= np.isin(hl, [j + 1 for j, s in enumerate(hs) if s > HOLE])
        fg = ~bg
        cl, cn = ndimage.label(fg, np.ones((3, 3)))
        if cn:
            cs = ndimage.sum(fg, cl, range(1, cn + 1)); fg = np.isin(cl, [j + 1 for j, s in enumerate(cs) if s >= MINPIECE])
        ys, xs = np.where(fg)
        if not len(ys):
            raise SystemExit('%s cell %d: empty' % (path, i))
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        out.append((fg[y0:y1, x0:x1], int(x0), int(y0), a))
    return out


def to1x(a, m, x0, y0, k):
    h, w = m.shape
    nw, nh = max(1, int(round(w * k))), max(1, int(round(h * k)))
    rgb = a[y0:y0 + h, x0:x0 + w]
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb * m[..., None]
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


def pages():
    """{view: {action: [(mask, x0, y0, page, ...)]}} from the frame map, each strip's cell count checked"""
    out = {}
    for r in csv.DictReader(open(os.path.join(FOLDER, 'combat-frame-map.csv'), encoding='utf-8-sig')):
        edges = [int(e) for e in r['horizontal_cut_edges_px'].split(',')] if r['horizontal_cut_edges_px'].strip() else None
        n = int(r['requested_frames'])
        if edges is not None and len(edges) - 1 != n:
            raise SystemExit('%s %s: %d cells in the map, %d requested' % (r['facing'], r['action'], len(edges) - 1, n))
        fr = read(os.path.join(FOLDER, *r['source_path'].split('/')), edges)
        out.setdefault(r['facing'], {})[r['action']] = fr
    return out


def baseW(m):
    """the widest row in the lowest 40% of a mask (steam and a raised arm do not count)"""
    h = m.shape[0]
    rows = m[int(h * 0.6):]
    best = 0
    for r in rows:
        xs = np.where(r)[0]
        if len(xs):
            best = max(best, xs.max() - xs.min() + 1)
    return float(best)


def contact(m):
    """x of the middle of the lowest 8% of opaque rows (bbox coordinates)"""
    h = m.shape[0]
    low = m[max(0, h - max(1, int(round(h * 0.08)))):]
    xs = np.where(low.any(0))[0]
    return (xs.min() + xs.max() + 1) / 2.0


def cut():
    """{sheet: {row: {view: [(RGBA, x, y) from the anchor]}}}, notes"""
    P = pages()
    rows = {s: {r: {} for r in ORDER[s]} for s in ORDER}
    notes = []
    for v in VIEWS:
        pg = P[v]
        ih = float(np.median([f[0].shape[0] for f in pg['baked-idle']]))
        kv = TALL / ih
        k = {}
        for act in pg:
            if act.startswith('baked') or act == 'split-jacket':
                k[act] = kv * ih / float(pg[act][0][0].shape[0])
        k['baked-idle'] = kv
        tgt = baseW(pg['split-jacket'][-1][0]) * k['split-jacket']             # (the mash as the split leaves it)
        for act in pg:
            if act.startswith('mashed') and act != 'mashed-prone':
                k[act] = tgt / baseW(pg[act][0][0])
        k['mashed-prone'] = k['mashed-fall'] * pg['mashed-fall'][-1][0].shape[1] / float(pg['mashed-prone'][0][0].shape[1])
        if v == 'SE':
            KSE = dict(k)
        notes.append('%s: baked idle %d src px tall (k %.4f), split6 base -> %.1f px; k %s' % (v, ih, kv, tgt, ', '.join('%s %.4f' % (q, k[q]) for q in k)))
        for act, fr in pg.items():
            sh, row = ROW[act]
            ref = fr[0][1] + contact(fr[0][0])                                  # frame 1's ground contact, cell coordinates
            out = []
            for m, x0, y0, a in fr:
                o = to1x(a, m, x0, y0, k[act])
                ys = np.where((o[..., 3] > 0).any(1))[0]
                out.append((o, int(round((x0 - ref) * k[act])) - 1, -int(ys[-1])))
            rows[sh][row][v] = out
    # the chunk: one scale (the mash's SE idle), by its centre of mass, the same in all eight
    fx = P['FX']['chunk']
    # (the desk, 11-26: at the mash's scale the FX page's chunk came out ~100 px, the mound's own size -- the page draws it far larger; a hot fistful in the
    # air reads at CHUNK_PX across its first frame)
    kc = CHUNK_PX / float(fx[0][0].shape[1])
    out = []
    for m, x0, y0, a in fx:
        o = to1x(a, m, x0, y0, kc)
        al = o[..., 3] > 0
        cy, cx = ndimage.center_of_mass(al)
        out.append((o, -int(round(cx)), -int(round(cy))))
    for v in VIEWS:
        rows['p2']['chunk'][v] = out
    notes.append('chunk: k %.4f (the mash SE idle scale), %d frames' % (kc, len(out)))
    return rows, notes


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows, sh):
    order = ORDER[sh]
    up = max(-y for r in order for v in VIEWS for o, x, y in rows[r][v]) + 2
    dn = max(y + o.shape[0] for r in order for v in VIEWS for o, x, y in rows[r][v]) + 2
    fh, ay = up + dn, up
    cells, geo = {}, {}
    for r in order:
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
        if r in FXROWS:
            cells[r] = [drawn[7] for f in range(8)]
        else:
            cells[r] = [drawn[f] if f in drawn else [mirror(c) for c in drawn[MIRROR[f]]] for f in range(8)]
        geo[r] = (int(fw), int(fh), int(hw), int(ay))
    return cells, geo


def write(sh, cells, geo):
    order = ORDER[sh]
    name, jname = NAMES[sh]
    wide = max(len(cells[r][0]) * geo[r][0] for r in order)
    H = sum(8 * geo[r][1] for r in order)
    sheet = np.zeros((H, wide, 4), np.uint8)
    meta, y = {}, 0
    for r in order:
        fw, fh, ax, ay = geo[r]
        meta[r] = {'y': y, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(cells[r][0]), 'fps': FPS[sh][r]}
        meta[r].update(EXTRA.get(sh, {}).get(r, {}))
        for f in range(8):
            for i, c in enumerate(cells[r][f]):
                sheet[y + f * fh:y + (f + 1) * fh, i * fw:(i + 1) * fw] = c
        y += 8 * fh
    fw0, fh0, ax0, ay0 = geo['idle']
    top = pix.top_of(cells['idle'][0] + cells['idle'][7], ay0)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, name + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % name, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': jname, 'source': SOURCE, 'anims': meta},
              open(os.path.join(pix.ART, name + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (name, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in order)))


def review(sh, cells, geo, folder, scale=2, bg=(14, 20, 48)):
    os.makedirs(folder, exist_ok=True)
    order = ORDER[sh]
    name = NAMES[sh][0]
    for f, nm in [(7, 'SE'), (5, 'NE'), (0, 'S'), (6, 'E'), (4, 'N'), (1, 'SW')]:
        W = max(len(cells[r][f]) * geo[r][0] for r in order); H = sum(geo[r][1] for r in order)
        im = Image.new('RGB', (W, H), bg); y = 0
        for r in order:
            fw, fh, ax, ay = geo[r]
            for i, c in enumerate(cells[r][f]):
                p = Image.fromarray(c, 'RGBA'); im.paste(p, (i * fw, y), p)
                im.putpixel((i * fw + ax, y + ay), (255, 0, 255))
            y += fh
        im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(folder, '%s-review-%s.png' % (name, nm)))
    print('  review: ' + folder)


def lineup(c1, g1, c2, g2, folder, refs=('owlbear_p1', 'ogre_p1', 'troll_p1', 'shieldguardian_p1'), bg=(14, 20, 48)):
    items = []
    for r in refs:
        j = json.load(open(os.path.join(pix.ART, r + '.json')))
        an = j['anims']['idle']
        im = Image.open(os.path.join(pix.ART, r + '.png')).convert('RGBA')
        y0 = an['y'] + 7 * an['fh']
        items.append((im.crop((0, y0, an['fw'], y0 + an['fh'])), an['ax'], an['ay'], r))
    for c, g in ((c1, g1), (c2, g2)):
        fw, fh, ax, ay = g['idle']
        items.append((Image.fromarray(c['idle'][7][0], 'RGBA'), ax, ay, 'jacketbruiser'))
    W = sum(i[0].width for i in items) + 16 * (len(items) + 1)
    up = max(i[2] for i in items) + 8; dn = max(i[0].height - i[2] for i in items) + 8
    im = Image.new('RGB', (W, up + dn), bg)
    x = 16
    for p, ax, ay, nm in items:
        im.paste(p, (x, up - ay), p); x += p.width + 16
    for xx in range(W):
        im.putpixel((xx, up), (60, 80, 140))
    im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    im.save(os.path.join(folder, 'jacketbruiser-lineup.png'))
    print('  lineup: ' + os.path.join(folder, 'jacketbruiser-lineup.png'))


if __name__ == '__main__':
    rows, notes = cut()
    for nt in notes:
        print('  ' + nt)
    built = {}
    for sh in ('p1', 'p2'):
        cells, geo = lay(rows[sh], sh)
        write(sh, cells, geo)
        built[sh] = (cells, geo)
    if 'check' in sys.argv:
        folder = os.path.join(ROOT, 'deep16', 'art-src', 'jacketbruiser')
        for sh in ('p1', 'p2'):
            review(sh, built[sh][0], built[sh][1], folder)
        lineup(built['p1'][0], built['p1'][1], built['p2'][0], built['p2'][1], folder)
