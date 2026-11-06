"""DEEP16 pipeline 2 (generated art): Doran Waterby, the Halfway Inn's keeper -> doran_p1 (his town figure) and doran_p2 (his fight figure), all eight facings.

    python tools/doran-sheet.py [doran_p1|doran_p2]          (writes deep16/art/<name>.png/.json; both with no name)
    python tools/doran-sheet.py [name] check                 (also deep16/art-src/doran/<name>-review.png: every row of every drawn view at 3x)

Asked in art-wanted section 35 (11-04, the Inn seat); cut 11-05 by the Waterby cutter (waterby-cutter-1105) on the lanes desk's relay of Griz's "We got
art for the waterby inkeeps in Fresh". The art desk's batches, sorted to deep16/_src/doran/:
  INN-TOWN-1105    HALFWAY-INN-DORAN-TOWN: one page a view (H07 S, H08 SE, H09 E, H10 NE, H11 N), Idle 4 over Walk 8 -- the walk with a wooden bucket in his
                   left hand, the idle empty-handed. Its FRAME-MAP.csv gives each drawing's box (tight: padded here, 10 px a side; the fight's 3).
  INN-COMBAT-1105  HALFWAY-INN-DORAN-COMBAT: one page a view (H06 SE, H07 NE, H08 S, H09 E, H10 N), the woodaxe two-handed: Attack 4 (ready, overhead,
                   the low chop, recovery), Flinch 4, Fall 4 (kneeling, the hip collapse and the axe let go, lying), Prone 1 (the axe beside him), Sit 1
                   (the axe across his knees). Its FRAME-MAP.csv likewise (North's Fall 4 and Prone boxes widened by the art desk to take the axe).
  INN-IDLE-1106    his armed idle (11-06, on Griz's "doran didn't seem to return to idle after axe attack, but graphics otherwise approved"): one loose page,
                   "Doran Waterby five-view axe idle sheet.png", bands SE NE S E N, Idle 4 (the haft across him, a breath); no map -- its boxes in _IB.

doran_p1 (the inn's floor: doranYard, doranIn -- js/counter.js C.FIG): idle <- Idle 4; walk <- Walk 8 (the bucket).

doran_p2 (every fight he is in: js/data/foes.js doran): idle <- the armed Idle 4 (11-06; till then Attack 1 held, one frame, and after a chop he read as
stuck), at the fight page's scale times each view's fit to Attack 1 by the head and shoulders (TIE); walk <- the town Walk 8 (the bucket -- no axe walk was drawn:
deep16-dream-polish.md); attack <- Attack 4 (`release` 2: the low chop on frame 3);
flinch <- Flinch 4; hurt <- Fall 4 (he dies lying, the axe beside him); prone <- Fall 2-4 then Prone 1 (js/sprites.js S.proneRow: where he lies); sit
<- Sit 1. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors (the bucket's hand mirrors too).

How a drawing is cut (shared with tools/gennet-sheet.py, which loads this file): its window, the navy by the window's edges (a navy hole bigger than HOLE
stays navy, the bucket's handle and the space between the knees), then the main body and what lies near it or is big enough -- the printed numbers
and a neighbour's edge at the window's side go. One scale a GROUP: the town's idle and walk each by their own median height (the art desk's note: his
walk was drawn up to 1.15 x his idle, more than a stride explains -- "normalize body/head size"), the fight page by its standing frames (Attack 1 and 4,
Flinch 1 and 4, the art desk's own proof), each to TALL sole to crown. A standing frame stands on its lowest row by its torso's middle (the top 55%);
one on the ground (the fall's last two, the prone, the sit) by its whole body's middle. Boxed down, snapped to the 64 (red and fire left out: his
skin and leather), outlined.
"""
import csv, importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
OUTL = np.array([int(P['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)

FH, AY = 64, 61
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
BG_TOL, HOLE = 30, 400
NEAR, BIG = 4, 0.03            # (a piece kept: within NEAR px of the main body -- a hand's dagger, a lantern's bail -- or BIG of its size -- the axe let go)


def csv_windows(folder, views, pad):
    """{(action, i0, view): (file, box)} from an art desk FRAME-MAP.csv: file, action, frame_one_based, left, top, right_exclusive, bottom_exclusive"""
    out = {}
    for r in csv.DictReader(open(os.path.join(folder, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        box = (int(r['left']) - pad, int(r['top']) - pad, int(r['right_exclusive']) + pad, int(r['bottom_exclusive']) + pad)
        out[(r['action'].lower(), int(r['frame_one_based']) - 1, views[r['file']])] = (r['file'], box, int(r['bottom_exclusive']))
    return out


def manifest_windows(folder, pad=0):
    """{(action, i0, view): (file, box)} from an art desk MANIFEST.json: pages[].view / file / frames[].action, frame (one-based), window -- a frame
    with no action of its own takes the manifest's (HALFWAY-INN-GENNET-FIGHT-WALK, 11-06: one `action` at its head, "Fight Walk")"""
    out = {}
    mf = json.load(open(os.path.join(folder, 'MANIFEST.json'), encoding='utf-8'))
    for pg in mf['pages']:
        for fr in pg['frames']:
            x0, y0, x1, y1 = fr['window']
            out[(fr.get('action', mf.get('action', '')).lower(), int(fr['frame']) - 1, pg['view'])] = (pg['file'], (x0 - pad, y0 - pad, x1 + pad, y1 + pad), None)
    return out


def letters(pg, floors=(), tol=None):
    """the printed labels and numbers on a whole page: a small piece of white or light grey with the page's navy round most of it, or (`floors`: the
    art desk's tight boxes, (x0, y0, x1, bottom)) one centred below a box's bottom under it -- a number's top can touch a boot (Doran's S Flinch 3),
    and its own drop shadow rings it there. Inside a box nothing is lettering: the axe's bright steel stays"""
    bg = np.median(np.concatenate([pg[:, :4].reshape(-1, 3), pg[:, -4:].reshape(-1, 3)]), axis=0)
    navy = np.linalg.norm(pg - bg, axis=2) < (tol or BG_TOL)
    lite = (pg.min(-1) > 150) & (pg.max(-1) - pg.min(-1) < 45)
    ll, ln = ndimage.label(lite, structure=np.ones((3, 3)))
    out = np.zeros(lite.shape, bool)
    for i, sl in enumerate(ndimage.find_objects(ll)):
        if sl[0].stop - sl[0].start > 30 or sl[1].stop - sl[1].start > 30:
            continue
        y0, y1, x0, x1 = max(0, sl[0].start - 3), sl[0].stop + 3, max(0, sl[1].start - 3), sl[1].stop + 3
        pc = ll[y0:y1, x0:x1] == i + 1; ring = ndimage.binary_dilation(pc, iterations=2) & ~pc
        cy, cx = (sl[0].start + sl[0].stop) / 2.0, (sl[1].start + sl[1].stop) / 2.0
        under = any(bx0 <= cx < bx1 and cy > bot for bx0, by0, bx1, bot in floors)
        inside = any(bx0 <= cx < bx1 and by0 <= cy <= bot for bx0, by0, bx1, bot in floors)   # (inside a drawing's own box: its steel, never lettering)
        if under or (not inside and ring.any() and navy[y0:y1, x0:x1][ring].mean() > 0.6):
            near_ = (pg[y0:y1, x0:x1].max(-1) < 60) | (np.linalg.norm(pg[y0:y1, x0:x1] - bg, axis=2) < 70)   # (its drop shadow and grey edge with it, not a boot's warm one)
            out[y0:y1, x0:x1] |= pc | (ndimage.binary_dilation(pc, iterations=2) & (near_ | (pg[y0:y1, x0:x1, 2] >= pg[y0:y1, x0:x1, 0])) & ~(pg[y0:y1, x0:x1].max(-1) < 14))
    return out


def figure(a, shadow=False, drop=None, below=False, tol=None):
    """the drawing in a window: not the navy reaching in from the window's edges (nor, with `shadow`, the baked dark ground shadow beside it), a navy
    hole bigger than HOLE left navy, nor `drop` (the page's lettering); then the main body and what is near it or big -- a neighbour's edge at the side goes"""
    bg = np.median(np.concatenate([a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3), a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < (tol or BG_TOL)    # (`tol`: a source's own -- Willem's navy coat sits 12 to 30 off the page's navy, so his is 10)
    flood = near.copy()
    if shadow:                                            # (Gennet's walk: a dark ellipse under the boots, navy darkened -- blue over red by 6 to 28, nothing over 38;
        br = a[..., 2] - a[..., 0]                        # the outline's black has no blue in it, so the flood stops there)
        flood |= (a.max(-1) < 38) & (br >= 6) & (br <= 28) & (a[..., 1] <= a[..., 2])
    lab, n = ndimage.label(flood)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(edge))
    hl, hn = ndimage.label(near & ~out)
    hs = ndimage.sum(near & ~out, hl, range(1, hn + 1))
    out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    if drop is not None:
        out |= drop
    if below:                                             # (`below`: windows that hold the frame's printed number under the feet -- Gennet's: a small
        lite = (a.min(-1) > 150) & (a.max(-1) - a.min(-1) < 45) & ~out    # bright piece whose top is at or under the body's lowest row is its number)
        ll, ln = ndimage.label(lite, structure=np.ones((3, 3)))
        small = np.zeros_like(lite)
        for i, sl in enumerate(ndimage.find_objects(ll)):
            if sl[0].stop - sl[0].start <= 30 and sl[1].stop - sl[1].start <= 30:
                small[sl] |= ll[sl] == i + 1
        body = ~out & ~small
        bl, bn = ndimage.label(body, structure=np.ones((3, 3)))
        if bn:
            bs = ndimage.sum(body, bl, range(1, bn + 1)); main = bl == int(np.argmax(bs)) + 1
            mw = main & (a[..., 0] > a[..., 2] + 8)        # (at a tight `tol`, Willem's, the foot by the body's warm pixels, the boots: a number's dark blue drop shadow joins the body there)
            foot = np.where((mw if tol and mw.any() else main).any(1))[0].max()
            sl_, sn_ = ndimage.label(small, structure=np.ones((3, 3)))
            for i, sl in enumerate(ndimage.find_objects(sl_)):
                if sl[0].start >= foot - 2:
                    pc = sl_ == i + 1
                    if tol:                                # (at a tight `tol` the number's drop shadow is part of the body: protect only the body's warm pixels, the boots)
                        out |= pc | (ndimage.binary_dilation(pc, iterations=3) & (a[..., 2] >= a[..., 0]) & ~(a.max(-1) < 14) & ~mw)
                    else:
                        out |= pc | (ndimage.binary_dilation(pc, iterations=2) & (a[..., 2] >= a[..., 0]) & ~(a.max(-1) < 14) & ~main)
    fg = ~out
    fl, fn = ndimage.label(fg, structure=np.ones((3, 3)))
    if not fn:
        raise SystemExit('nothing drawn in the window')
    sz = ndimage.sum(fg, fl, range(1, fn + 1)); big = int(np.argmax(sz)) + 1
    reach = ndimage.binary_dilation(fl == big, iterations=NEAR)
    objs = ndimage.find_objects(fl); H, W = fg.shape
    keep = [big]
    for i in range(1, fn + 1):
        if i == big:
            continue
        sl = objs[i - 1]
        at_edge = sl[0].start == 0 or sl[1].start == 0 or sl[0].stop == H or sl[1].stop == W
        if not at_edge and (sz[i - 1] >= BIG * sz[big - 1] or (reach & (fl == i)).any()):
            keep.append(i)
    return np.isin(fl, keep)


def flame(rgb01):
    """a lantern's flame: bright, orange to yellow -- snapped with the fire ramp, the rest without it"""
    r, g, b = rgb01[..., 0], rgb01[..., 1], rgb01[..., 2]
    return (r > 0.85) & (g > 0.45) & (r - b > 0.45)


def to1x(rgb, mask, k, avoid, fire_ok=False):
    h, w = mask.shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb.astype(np.float32) * mask[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    sn = pix.snap(c, avoid)
    if fire_ok:                                            # (the flame alone on the fire ramp: the art desk's "Flame alone uses the fire ramp")
        fm = flame(c); sn[fm] = pix.snap(c, [r for r in avoid if r != 'fire'])[fm]
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = sn[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def cut(L, look):
    """L: a figure's spec (SOURCES, GROUPS, LOOKS); look: the sheet to write"""
    lk = L['LOOKS'][look]
    need = sorted({(src, act, i) for _, _, keys in lk['rows'] for (src, act, i) in keys}
                  | {(src, act, i) for (src, _), (acts, meas) in L['GROUPS'].items() for (act, i) in meas if any(r[0] == src for _, _, ks in lk['rows'] for r in ks)})
    pages, crops = {}, {}
    for src, act, i in need:
        S = L['SOURCES'][src]
        for view in FACE:
            w_ = S['windows'][(act, i, view)]; fn, (x0, y0, x1, y1) = w_[0], w_[1]; floor = w_[3] if len(w_) > 3 else None   # (a 4th: the band's floor on the page -- tools/willem-sheet.py)
            if (src, fn) not in pages:
                pg = np.asarray(Image.open(os.path.join(S['folder'], fn)).convert('RGB')).astype(np.float32)
                fl_ = [(w[1][0], w[1][1], w[1][2], w[2]) for w in S['windows'].values() if w[0] == fn and w[2] is not None]
                pages[(src, fn)] = (pg, letters(pg, fl_, S.get('tol')))
            pg, lt = pages[(src, fn)]; x0, y0, x1, y1 = max(0, x0), max(0, y0), min(pg.shape[1], x1), min(pg.shape[0], y1)
            a = pg[y0:y1, x0:x1]
            m = figure(a, S.get('shadow', False), lt[y0:y1, x0:x1], S.get('below', False), S.get('tol')); ys, xs = np.where(m)
            sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            crops[(src, act, i, view)] = (a[sl], m[sl], (floor - (y0 + sl[0].stop)) if floor is not None else 0)   # (how far its lowest row stands above its band's floor)
    # one scale a group: (source, group) -> its actions and the frames it is measured by
    scale = {}
    for (src, grp), (acts, meas) in L['GROUPS'].items():
        for view in FACE:
            hs = [crops[(src, act, i, view)][1].shape[0] for (act, i) in meas if (src, act, i, view) in crops]
            if hs:
                for act in acts:
                    scale[(src, act, view)] = lk.get('tall', L['TALL']) / float(np.median(hs))
    for (src, act), (rsrc, ract, fit) in L.get('TIE', {}).items():   # (`TIE`: a page drawn to go with another page's frames takes that group's scale a view, times
        for view in FACE:                                            # the fit of the one to the other by the head and shoulders -- Doran's armed idle on his fight page's)
            if (rsrc, ract, view) in scale:
                scale[(src, act, view)] = scale[(rsrc, ract, view)] * fit[view]
    cells, tops = {}, {}
    for (src, act, i, view), (rgb, m, above) in crops.items():
        k = scale[(src, act, view)]
        o = to1x(rgb, m, k, L['AVOID'], L['SOURCES'][src].get('fire_ok', L.get('FIRE_OK', False)))   # (a source's own `fire_ok`: Gennet's fight walk has no lantern)
        al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
        if (src, act, i) in L['GROUND']:
            cx = ndimage.center_of_mass(al)[1]
        else:
            top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
            cx = ndimage.center_of_mass(top)[1]
        lift = int(round(above * k)) if act in L.get('LIFT', ()) else 0   # (`LIFT`: a row that keeps its lift -- Willem's run stands on its band's floor, not its own lowest row)
        cells[(FACE[view], src, act, i)] = (o, cx, ys[-1] + lift)
        tops[(FACE[view], src, act, i)] = (ys[0], ys[-1] - ys[0])
    for (src, act) in L.get('CROWN', ()):                 # (`CROWN`: a walk the art desk drew with the head level and the lifted sole sometimes lowest -- each frame
        for f in set(FACE.values()):                      # stood by its crown, the loop's median height on the ground line: Gennet's fight walk, 11-06)
            ks = [c for c in cells if c[:3] == (f, src, act)]
            if not ks:
                continue
            med = int(round(np.median([tops[c][1] for c in ks])))
            for c in ks:
                o, cx, _ = cells[c]; cells[c] = (o, cx, tops[c][0] + med)
    for mf, sf in MIRROR.items():
        for (f, src, act, i) in [c for c in list(cells) if c[0] == sf]:
            o, cx, foot = cells[(f, src, act, i)]
            cells[(mf, src, act, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, keys in lk['rows']:
        reach = max(max(cx, o.shape[1] - cx) for f in range(8) for k in keys for (o, cx, foot) in [cells[(f,) + tuple(k)]])
        fw = int(2 * np.ceil(reach + 2)); ax = fw // 2
        blk = np.zeros((8 * FH, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k in enumerate(keys):
                o, cx, foot = cells[(f,) + tuple(k)]
                dx, dy = int(round(ax - cx)), AY - foot
                h, w = o.shape[:2]
                cy0, cx0 = f * FH + max(0, dy), j * fw + max(0, dx)
                sy, sx = max(0, -dy), max(0, -dx)
                hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, fw - max(0, dx))
                sub = o[sy:sy + hh, sx:sx + ww]; dst = blk[cy0:cy0 + hh, cx0:cx0 + ww]
                put = sub[..., 3] > 0; dst[put] = sub[put]
        a = dict(y=y, fw=fw, fh=FH, ax=ax, ay=AY, frames=len(keys), fps=fps)
        if name in lk.get('release', {}):
            a['release'] = lk['release'][name]
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', look + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % look, fw=i0['fw'], fh=FH, ax=i0['ax'], ay=AY, top=lk.get('tall', L['TALL']), anims=anims, name=L['NAME'], hold=lk['hold'], source=lk['source'])
    with open(os.path.join(ROOT, 'deep16', 'art', look + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    sc = sorted({(s, v, round(k, 4)) for (s, act, v), k in scale.items()})
    print('%s: %dx%d, rows %s' % (look, W, y, ', '.join('%s %d@%dpx' % (n_, a_['frames'], a_['fw']) for n_, a_ in anims.items())))
    print('  scales: ' + ', '.join('%s %s %.4f' % t for t in sc))
    if 'check' in sys.argv:
        Z = 3; out = os.path.join(ROOT, 'deep16', 'art-src', L['SRCDIR']); os.makedirs(out, exist_ok=True)
        tiles = []
        for name, fps, keys in lk['rows']:
            a = anims[name]
            for f in [0, 7, 6, 5, 4, 1, 2, 3]:
                tiles.append(sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * a['frames']])
        rv = Image.new('RGBA', (W * Z, len(tiles) * FH * Z), (12, 20, 40, 255))
        for j, t in enumerate(tiles):
            rv.alpha_composite(Image.fromarray(t, 'RGBA').resize((t.shape[1] * Z, FH * Z), Image.NEAREST), (0, j * FH * Z))
        rv.save(os.path.join(out, look + '-review.png'), optimize=True)
        print('review:', os.path.join(out, look + '-review.png'))
    return sheet, anims


# ---------------------------------------------------------------- Doran
_D = os.path.join(pix.SRC, 'doran')
SOURCES = {
    'town': dict(folder=os.path.join(_D, 'INN-TOWN-1105'), windows=csv_windows(os.path.join(_D, 'INN-TOWN-1105'),
                 {'H07-S.png': 'S', 'H08-SE.png': 'SE', 'H09-E.png': 'E', 'H10-NE.png': 'NE', 'H11-N.png': 'N'}, 10)),
    'fight': dict(folder=os.path.join(_D, 'INN-COMBAT-1105'), windows=csv_windows(os.path.join(_D, 'INN-COMBAT-1105'),
                  {'H06-SE.png': 'SE', 'H07-NE.png': 'NE', 'H08-S.png': 'S', 'H09-E.png': 'E', 'H10-N.png': 'N'}, 3)),   # (3: the printed numbers sit a few px under the boxes)
}
# his armed idle (11-06): one loose page, no map -- the drawings' boxes found by the navy between them (the page's figures, dilated 4 px, each piece over 60 px),
# the bands SE NE S E N top to bottom as its row labels print them, Idle 1-4 left to right; padded 3 a side as the fight page's
_IDLE = 'Doran Waterby five-view axe idle sheet.png'
_IB = {'SE': [(266, 16, 405, 188), (547, 15, 689, 188), (827, 25, 968, 188), (1095, 15, 1236, 188)],
       'NE': [(261, 221, 409, 387), (541, 219, 692, 387), (817, 223, 968, 388), (1092, 221, 1239, 387)],
       'S': [(266, 425, 402, 590), (542, 424, 683, 590), (819, 427, 959, 590), (1096, 425, 1232, 590)],
       'E': [(265, 623, 401, 774), (545, 622, 683, 774), (821, 626, 959, 774), (1098, 623, 1235, 774)],
       'N': [(259, 807, 406, 969), (541, 805, 688, 969), (816, 807, 967, 969), (1092, 807, 1239, 969)]}
SOURCES['axeidle'] = dict(folder=os.path.join(_D, 'INN-IDLE-1106'),
                          windows={('idle', i, v): (_IDLE, (b[0] - 3, b[1] - 3, b[2] + 3, b[3] + 3), b[3]) for v, bs in _IB.items() for i, b in enumerate(bs)})
GROUPS = {('town', 'idle'): (['idle'], [('idle', i) for i in range(4)]),
          ('town', 'walk'): (['walk'], [('walk', i) for i in range(8)]),
          ('fight', 'all'): (['attack', 'flinch', 'fall', 'prone', 'sit'], [('attack', 0), ('attack', 3), ('flinch', 0), ('flinch', 3)])}
GROUND = {('fight', 'fall', 2), ('fight', 'fall', 3), ('fight', 'prone', 0), ('fight', 'sit', 0)}
# his armed idle at his fight page's scale, times the page-to-page fit of Idle 1 on Attack 1 and on Attack 4 by the top 42% (the head and shoulders, free
# offset, the best overlap at 0.01 steps; the two fits averaged): the idle is drawn a guard lower than Attack 1 in E and N, so a height measure would swell
# him there -- the head keeps his size from idle to chop (11-06, the cutter of the Waterbys' 11-06 pages)
TIE = {('axeidle', 'idle'): ('fight', 'attack', {'SE': 1.005, 'NE': 0.99, 'S': 1.05, 'E': 1.055, 'N': 1.015})}
TALL = 51                      # (sole to crown: a big man -- the townsman folkman_p1 50, the keepers 49 to 50, the heroes 49 to 54)
AVOID = ['red', 'fire']
_src = ('drawn by the art desk (HALFWAY-INN-DORAN-%s, 11-05: art-wanted section 35), cut by tools/doran-sheet.py; SW W NW mirrored')
LOOKS = {
    'doran_p1': dict(rows=[('idle', 4, [('town', 'idle', i) for i in range(4)]), ('walk', 9, [('town', 'walk', i) for i in range(8)])],
                     hold=['walk: the phases uneven and repeated, E\'s legs overlapping, N\'s 7-8 back on the right-side lift early (the art desk\'s own notes)',
                           'idle: the breath slight (the art desk\'s own note)'],
                     source=_src % 'TOWN' + '; the inn\'s floor (js/counter.js C.FIG doranYard, doranIn)'),
    'doran_p2': dict(rows=[('idle', 4, [('axeidle', 'idle', i) for i in range(4)]), ('walk', 9, [('town', 'walk', i) for i in range(8)]),
                           ('attack', 10, [('fight', 'attack', i) for i in range(4)]), ('flinch', 12, [('fight', 'flinch', i) for i in range(4)]),
                           ('hurt', 8, [('fight', 'fall', i) for i in range(4)]), ('prone', 8, [('fight', 'fall', 1), ('fight', 'fall', 2), ('fight', 'fall', 3), ('fight', 'prone', 0)]),
                           ('sit', 2, [('fight', 'sit', 0)])],
                     release={'attack': 2},
                     hold=['idle: the armed idle 4 (the art desk\'s 11-06 page), a guard lower than Attack 1 in E and N -- he rises into the chop and settles back; '
                           'SE Idle 3 dips the deepest; walk: the town walk, the bucket in his hand (no axe walk was drawn)',
                           'N fall 4 and prone: nearly face down, not the side-lying asked; N fall 3 sits toward screen right before the collapse (the art desk\'s own notes)',
                           'S fall 4 and prone share the SE side silhouette (the art desk\'s own note)'],
                     source=(_src % 'COMBAT') + ' -- the idle from the art desk\'s five-view axe idle page (11-06), the walk from HALFWAY-INN-DORAN-TOWN; every fight '
                            'he is in (deep16/data/foes.js doran)'),
}
DORAN = dict(SOURCES=SOURCES, GROUPS=GROUPS, GROUND=GROUND, TIE=TIE, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Doran Waterby', SRCDIR='doran')

if __name__ == '__main__':                               # (tools/gennet-sheet.py loads this file for its cutter, and runs its own looks)
    for lk_ in [a for a in sys.argv[1:] if a in LOOKS] or list(LOOKS):
        cut(DORAN, lk_)
