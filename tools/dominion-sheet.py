"""DEEP16 pipeline 2 (generated art): the Dominion's line soldier fighting -> dominion_p2, all eight facings; and the reader the soldiering cuts share.

    python tools/dominion-sheet.py            (writes deep16/art/dominion_p2.png/.json)
    python tools/dominion-sheet.py check      (also the review sheet, deep16/art-src/dominion/dominion_p2-review.png)
    python tools/dominion-sheet.py frames     (each frame's drawing box, its boots, its crown and head on its page)

Asked in art-wanted section 95 (11-21, the pose seat pose-1121, on his "Dominion will have both as well"): the Dominion's line soldier in black half plate with
round shield and longsword (the Attack over GUIDE-2026-11-13b-longsword-and-shield, and the Push for Soldiering), and his light crossbow. Drawn by the art desk as
ART-159 -- the LINE-SOLDIER-COMBAT handoff (sorted to deep16/_src/dominion/2026-11-24-ART-159-LINE-SOLDIER-COMBAT/) and the LIGHT-CROSSBOW handoff (to
deep16/_src/dominion/2026-11-24-ART-159-LIGHT-CROSSBOW/), each zip beside its folder; cut 11-24 by the cutter seat cutter-1124 on the lanes desk's message carrying
Griz's "Outbox sent and stuff in Fresh". Five views drawn, SW W NW the mirrors of SE E NE (RULED 10-14). Rows: idle 4, walk 8, attack 8 (the longsword, contact on
frame 4), push 6 (the shield drives on 4, the sword drawn back: deep16/js/features.js THE PUSH plays a sheet's `push`), flinch 4, hurt 6 (the Fall), prone 1 (Fall 6
held, as the map's source rectangle says), and `lightcrossbow` 8 (the bolt looses on 4) -- js/battle.js plays a blow's own row by its weapon's name, so the block's
Light Crossbow plays it with no change to the block. Worn by data/foes.js `dominion` in place of dominion_p1.

THE READER (shared with tools/guard-soldiering-sheet.py): a page's pieces (vivian-sheet's matte at BGTOL, the printed frame numbers dropped), grouped into its
drawings by nearness, and each drawing given to the map's cell it lies most in (`cells`) or, where a map gives no rectangles, taken in reading order (`in_order`).
Each frame then stands on its boots (tools/dragger-sheet.py ground(): the lowest run of boot colour -- a blade, a pike or a crossbow's steel is lighter and
greyer), and is measured crown to boots with the crown the first run CROWN wide that is not steel (dragger-sheet head()). The idle page by its idle to TALL (the
art desk's "near 53 px", beside guard_p2); every other page to its view's idle page by frame 1's crown to boots (`scales`: a look may add the head's width for
its walk and flinch, the dragger's rule for a leaning walk; the line soldier's helmeted head reads wide with his shield and blade, so his are by height alone). A
row drawn on a regular cell grid (the walk, the crossbow) stands by its cell, the crown level.
"""
import csv, importlib.util, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_old = sys.argv; sys.argv = sys.argv[:1]                       # (dragger-sheet reads argv at import: it must not act on ours)
_sp = importlib.util.spec_from_file_location('dragger_sheet', os.path.join(ROOT, 'tools', 'dragger-sheet.py'))
DG = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DG)
sys.argv = _old
VS = DG.VS
GAP = 6          # (source px: pieces nearer than this are one drawing -- a sword's tip, a shield's rim)
BGTOL = int(os.environ.get('DOMINION_BGTOL', '12'))   # (the matte: his black half plate sits within 20 of the art desk's navy -- at the dragger's 20 a hole
                                                      #  opened through E Attack's chest and N Push lost its shield's face; DG.page_mask reads DG.BGTOL)
DG.BGTOL = BGTOL
SPECK = 40       # (source px: a piece smaller is dither)


def drawings(path):
    """[(mask of the drawing on the page, its box x0 y0 x1 y1)], the page's figures with the printed numbers and specks left out"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    m = DG.page_mask(a)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab); sz = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    for i, (o, s) in enumerate(zip(objs, sz)):
        keep[i + 1] = s >= SPECK and not DG.is_label(a, lab, i + 1, o, s)
    fig = keep[lab]
    near, k = ndimage.label(ndimage.binary_dilation(fig, np.ones((2 * GAP + 1, 2 * GAP + 1), bool)))
    out = []
    for kk, sl in enumerate(ndimage.find_objects(near), 1):
        if sl is None:
            continue
        d = np.zeros_like(fig); d[sl] = fig[sl] & (near[sl] == kk)
        if not d.any():
            continue
        ys, xs = np.where(d)
        out.append((d, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)))
    return a, out


def cells(path, boxes):
    """{i: (mask, box)}: each drawing to the cell it lies most in (boxes: [x0, y0, x1, y1] the map's cell windows)"""
    a, ds = drawings(path)
    got = {}
    for d, bx in ds:
        ov = [d[y0:y1, x0:x1].sum() for x0, y0, x1, y1 in boxes]
        j = int(np.argmax(ov))
        if ov[j] == 0:
            continue
        if j in got:                                                    # (a piece of a drawing set apart: joined to it)
            m0 = got[j][0] | d; ys, xs = np.where(m0); got[j] = (m0, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
        else:
            got[j] = (d, bx)
    assert sorted(got) == list(range(len(boxes))), (path, sorted(got), len(boxes))
    return a, got


def in_order(path, n):
    """{i: (mask, box)}: the n biggest drawings in reading order -- bands by their middles, then left to right"""
    a, ds = drawings(path)
    ds = sorted(ds, key=lambda t: -t[0].sum())[:n]
    assert len(ds) == n, (path, len(ds), n)
    mids = sorted(ds, key=lambda t: (t[1][1] + t[1][3]) / 2.0)
    bands, cur = [], [mids[0]]
    for t in mids[1:]:
        ref = cur[-1][1]
        if (t[1][1] + t[1][3]) / 2.0 - (ref[1] + ref[3]) / 2.0 > 0.5 * (ref[3] - ref[1]):
            bands.append(cur); cur = [t]
        else:
            cur.append(t)
    bands.append(cur)
    order = [t for b in bands for t in sorted(b, key=lambda t: t[1][0])]
    return a, {i: (t[0], t[1]) for i, t in enumerate(order)}


def entry(batch, view, row, i, fn, a, d, bx, heads):
    """a vivian-sheet window for one drawing: its box padded, its boots, and its crown-to-boots and head width kept in `heads`"""
    x0, y0, x1, y1 = bx
    win = (max(0, x0 - DG.PAD), max(0, y0 - DG.PAD), min(a.shape[1], x1 + DG.PAD), min(a.shape[0], y1 + DG.PAD))
    g = y0 + DG.ground(a[y0:y1, x0:x1], d[y0:y1, x0:x1]) + 1
    hc, hw = DG.head(a[y0:y1, x0:x1], d[y0:y1, x0:x1])
    heads[(view, row, i)] = ((batch, fn), g - y0 - hc, hw)
    return (batch, view, row, i, fn, win, bx, g)


def scales(heads, n, two=('walk', 'flinch'), views=('S', 'SE', 'E', 'NE', 'N'), skip=('idle', 'prone')):
    """vivian-sheet's `pagescale`: each page against its view's idle page, by frame 1 against idle 1 -- crown to boots, and for `two` the head's width too"""
    ps = {}
    for v in views:
        ip, ih, iw = heads[(v, 'idle', 0)]
        ps[ip] = 1.0
        for rw in n:
            if rw in skip or (v, rw, 0) not in heads:
                continue
            pg, h1, w1 = heads[(v, rw, 0)]
            k = ih / float(h1)
            if rw in two:
                k = (k * iw / float(w1)) ** 0.5
            ps.setdefault(pg, k)
    return ps


# ---------------------------------------------------------------- the line soldier
SRC = 'dominion'
LS, XB = '2026-11-24-ART-159-LINE-SOLDIER-COMBAT', '2026-11-24-ART-159-LIGHT-CROSSBOW'
ROWS = {'Idle': 'idle', 'Walk': 'walk', 'Attack': 'attack', 'Push': 'push', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
N = {'idle': 4, 'walk': 8, 'attack': 8, 'push': 6, 'flinch': 4, 'hurt': 6, 'prone': 1, 'lightcrossbow': 8}
HEADS = {}
TALL = 52        # (crown row to boots; the helmet's dome adds a pixel: ~53, the art desk's "near 53 px" beside guard_p2)


def windows():
    d0 = os.path.join(VS.pix.SRC, SRC, LS)
    if not os.path.isdir(d0):
        return []
    rows = list(csv.DictReader(open(os.path.join(d0, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    out, cellof = [], {}
    bypage = {}
    for r in rows:
        bypage.setdefault(r['source'], []).append(r)
    for fn, rs in bypage.items():
        live = [r for r in rs if ROWS[r['action']] != 'prone']
        boxes = [(int(r['x']), int(r['y']), int(r['x']) + int(r['width']), int(r['y']) + int(r['height'])) for r in live]
        a, got = cells(os.path.join(d0, 'sources', fn), boxes)
        for j, r in enumerate(live):
            row = ROWS[r['action']]
            w = entry(LS, r['facing'], row, int(r['index']), 'sources/' + fn, a, got[j][0], got[j][1], HEADS)
            out.append(w + (boxes[j][1],)); cellof[(r['facing'], row, int(r['index']))] = boxes[j]
        for r in rs:
            if ROWS[r['action']] == 'prone':                            # (Prone holds Fall 6: its rectangle is Fall 6's cell)
                bx = (int(r['x']), int(r['y']), int(r['x']) + int(r['width']), int(r['y']) + int(r['height']))
                src = [w for w in out if w[1] == r['facing'] and w[2] == 'hurt' and cellof[(r['facing'], 'hurt', w[3])] == bx]
                assert len(src) == 1 and src[0][3] == 5, (r, [w[3] for w in src])
                out.append(src[0][:2] + ('prone', 0) + src[0][4:])
    # the crossbow (its own handoff): a page a view, two bands of four cells read left to right; the bolt looses on 4
    d1 = os.path.join(VS.pix.SRC, SRC, XB)
    xrows = list(csv.DictReader(open(os.path.join(d1, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    for v in ('S', 'SE', 'E', 'NE', 'N'):
        rs = sorted([r for r in xrows if r['facing'] == v], key=lambda r: int(r['index']))
        fn = 'ART-159-%s-CROSSBOW-FIRE8-SOURCE.png' % v
        boxes = [(int(r['x']), int(r['y']), int(r['x']) + int(r['width']), int(r['y']) + int(r['height'])) for r in rs]
        a, got = cells(os.path.join(d1, fn), boxes)
        for j, r in enumerate(rs):
            out.append(entry(XB, v, 'lightcrossbow', int(r['index']), fn, a, got[j][0], got[j][1], HEADS) + (boxes[j][1],))
    # the walk and the crossbow by their cells (each drawn on a regular grid, the crown held level): frame 1's boots, each frame's cell offset from frame 1's
    for i, w in enumerate(out):
        if w[2] in ('walk', 'lightcrossbow') and w[3] != 0:
            f0 = [x for x in out if x[1:4] == (w[1], w[2], 0)][0]
            out[i] = w[:7] + (f0[7] + (w[8] - f0[8]),) + w[8:]
    out = [w[:8] for w in out]
    got = {}
    for w in out:
        got.setdefault((w[1], w[2]), []).append(w[3])
    for (v, rw), ns in got.items():
        assert sorted(ns) == list(range(N[rw])), (v, rw, sorted(ns))   # (every number once, none skipped)
    assert set(v for v, _ in got) == {'S', 'SE', 'E', 'NE', 'N'}, sorted(got)
    return out


def register():
    """the look, its windows read (a tool that only borrows the reader -- tools/guard-soldiering-sheet.py -- imports this file without it)"""
    global _W, PS
    _W = windows()
    PS = scales(HEADS, N, two=())   # (by height alone: his walk marches upright, and the head's width reads his helmet with the shield's rim and the blade beside it --
                                    #  S Walk's "head" 108 to the idle's 87 -- where the dragger's bare curls read true)
    VS.LOOKS['dominion_p2'] = dict(LOOK, windows=_W, pagescale=PS)


LOOK = dict(src=SRC, name='Dominion Soldier', trim=False, tall=TALL, tallground=True, crownw=DG.CROWN, avoid=['fire'],
    bgtol=BGTOL,
    match={r: ('idle', 0) for r in N if r not in ('idle', 'prone')},   # (every page's scale is set by PS; `match` only marks them the look's own)
    ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)},
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('push', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1), ('lightcrossbow', 10, 8)],
    release={'attack': 3, 'push': 3, 'lightcrossbow': 3},
    hold=['push: the shield drives on frame 4, the sword kept drawn back -- deep16/js/features.js THE PUSH plays a sheet\'s `push` (Halldor\'s and Hedda\'s name)',
          'lightcrossbow: his Light Crossbow plays it (js/battle.js, a blow\'s own row by its weapon\'s name); drawn ready, the sword sheathed and the shield on his back; the engine draws the bolt',
          'walk: E 1 and 5 share a lead-foot silhouette, S\'s lead change hard to read (the art desk\'s own notes)',
          'push: S and N foreshortened, the extension less plain than SE\'s and E\'s (the art desk\'s own note)',
          'lightcrossbow: the release subtle in S and N; rear NE closer to profile than the identity page (the art desk\'s own notes)',
          'prone: the last Fall cel held'],
    source='drawn by the art desk (ART-159, 11-24: art-wanted section 95, the Dominion\'s line soldier in black half plate with round shield and longsword in five '
           'views, the Attack and the Push over the mannequin\'s guides, and his light crossbow), cut by tools/dominion-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    register()
    if 'frames' in sys.argv:
        for w in _W:
            h = HEADS.get(w[1:4])
            print(w[1], w[2], w[3], 'box', w[6], 'boots', w[7], 'below', w[6][3] - w[7], 'crown-to-boots', h[1] if h else '-', 'head', h[2] if h else '-')
        for pg, k in sorted(PS.items()):
            print('pagescale', pg[1], round(k, 4))
    else:
        VS.cut('dominion_p2')
