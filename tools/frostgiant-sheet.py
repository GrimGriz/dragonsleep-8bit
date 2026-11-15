"""DEEP16 pipeline 2 (generated art): the young frost giant, the SRD's Huge giant, the Coldridge route's rare brute at the road's top -> deep16/art/frostgiant_p1,
all eight facings.

    python tools/frostgiant-sheet.py            (writes deep16/art/frostgiant_p1.png/.json)
    python tools/frostgiant-sheet.py check      (also deep16/art-src/frostgiant/frostgiant_p1-review.png: every row of every facing at 2x)
    python tools/frostgiant-sheet.py dims       (only the drawings found on each page, their boxes and sizes)

Asked in art-wanted section 42 (ART-129, 11-11, the Coldridge route's random encounters -- Griz: "frost giant can be young rebellious adventurer type, still pretty
rare"); cut 11-15 by the cutter-fresh-1115 seat on Griz's "Please start cutting Fresh one at a time". The art desk's ART-129-YOUNG-FROST-GIANT-SOURCES, sorted out
of Fresh to deep16/_src/frostgiant/2026-11-14-ART-129-SOURCES/ (the zip beside it; every page's SHA-256 as MANIFEST.json says): a page a view and action -- HEAD 1
SE (its PAGE 01 the identity plate, not cut), 2 the rear NE, 3 S, 4 E, 5 N -- Idle 4, Walk 8, Greataxe 6, Rock 6, Flinch 4, Fall 6, Prone 1 (each Prone page a crop
of its Fall 6); 175 drawings, none missing.

FINDING THE DRAWINGS (the map gives each frame's band and column, no boxes): the navy flooded from the page's edges (a navy hole bigger than HOLE stays navy, as
tools/doran-sheet.py's figure); the pieces left, labelled; the BODIES are the biggest, one a frame (MANIFEST's count), put in their bands by height and their
columns by x; every other piece of size goes to the nearest body in its band -- the Rock 1 boulder at his feet, a breath of fog -- unless it lies under that
body's soles (a printed number). Every frame's count and order is checked against MANIFEST's bands.

Scale: the stone giant's standing height, as the ask says (stonegiant_p1's SE Idle 1, 153 px sole to crown): ONE scale for every view, the SE Idle to TALL, the
other views as drawn (each view's Idle drawn at its own page's size -- the art desk's pages are not one scale -- so each view's Idle is fitted to the SE's by
its median height). Every other page of a view is fitted to that view's Idle by its standing frames' heights (FIT below), as the owlbear's and griffon's were:
Greataxe 1, Flinch 1 and 4, Fall 1 (each stands as the Idle does); the Walk by its median height times WALK_DIP (a long stride stands a little lower); the
Rock by its frame 6 (he straightens); the Prone, a crop of Fall 6, at the Fall's.

THE BREATH (11-15, on the lanes desk's relay of Griz's "1-3 leans", after his ruling on drawn breath: "should be done with the engine like we're doing other things"):
the art desk drew a puff, a cloud and its wisps on Idle 2-4; defog() takes them out, laid on Idle 1, and keeps where the cloud left his face and the way it drifted: the
Idle row's `mouth`, a facing each, which deep16/js/looks.js LK.exhale breathes from (data/foes.js frostgiant `exhale: 'frost'`).

Where each drawing stands: a standing frame by its FEET -- the middle of its lowest 12% (the two boots) on the ground line -- so the greataxe's swing does not
slide him; a lying one (Fall 4-6, the Prone) by its whole body's middle. Each row its own cell, the anchor at the ground line's middle (the stone giant's rows
are so: an overhead swing wants headroom). Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.

Rows: idle 4; walk 8; attack 6 (the Greataxe -- js/battle.js plays `attack` where the sheet has no `greataxe`; `release` 3: frame 4 the blow); throw 6 (the
Rock's own row, its `row`; `release` 3: frame 4 the rock leaves his hands, the code draws it in flight -- js/fx.js 'rock'); flinch 4; hurt 6 (Fall, held on 6:
on his side, the axe beside him); prone 2 (Fall 5, then the Prone page: where he lies -- js/sprites.js S.proneRow); getup 3 (Fall 5, 4, 3: the fall run back
to his knees).
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
pix = DS.pix

FOLDER = os.path.join(pix.SRC, 'frostgiant', '2026-11-14-ART-129-SOURCES')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'frostgiant', os.path.basename(FOLDER))
NAME = 'frostgiant_p1'
TALL = 153                      # (the stone giant's SE Idle 1, sole to crown: stonegiant_p1 -- the ask: "the frost giant stands as tall")
TOL, HOLE = 30, 400             # (the navy: tools/doran-sheet.py's BG_TOL and HOLE)
MINA = 60                       # (a piece smaller than this, in page pixels, is a speck)
BIG = 0.03                      # (a piece this share of the page's biggest or more sets the bands and columns: bodies, the boulder; numbers are under 2%)
PAD = 24                        # (a piece within PAD of a body's box, and not under its soles, is that body's)
FEET = 0.12
WALK_DIP = 1.0
AVOID = ['red']
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
ACTS = ['idle', 'walk', 'attack', 'throw', 'flinch', 'hurt', 'prone']
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}
ROWS = [('idle', 6, [('idle', i) for i in range(4)]), ('walk', 10, [('walk', i) for i in range(8)]), ('attack', 10, [('attack', i) for i in range(6)]),
        ('throw', 10, [('throw', i) for i in range(6)]), ('flinch', 12, [('flinch', i) for i in range(4)]), ('hurt', 8, [('hurt', i) for i in range(6)]),
        ('prone', 8, [('hurt', 4), ('prone', 0)]), ('getup', 8, [('hurt', 4), ('hurt', 3), ('hurt', 2)])]
RELEASE = {'attack': 3, 'throw': 3}                                      # (the art desk's events: Greataxe contact 4, Rock release 4 -- zero-based)
HOLD = ['walk: the lead-leg switch is subtle in SE (4-5, 8-1), NE and E -- check the alternation in playback (the art desk\'s own notes)',
        'the pages are drawn at their own sizes (the Idles 537 to 624 px, the axe pages about 400): each fitted by a standing frame\'s height, the axe in it -- '
        'it tops his head by 3 to 6% in the idles, so a view can be a few percent off another',
        'N greataxe: the axe reads to screen-right in the rear contact and recovery; N fall angles a little right (the art desk\'s own notes)']
SOURCE = ('drawn by the art desk (ART-129-YOUNG-FROST-GIANT-SOURCES, 11-14: art-wanted section 42), cut by tools/frostgiant-sheet.py; SW W NW mirrored -- '
          'the SRD 5.1 Frost Giant: deep16/data/foes.js frostgiant')

MF = json.load(open(os.path.join(FOLDER, 'MANIFEST.json'), encoding='utf-8')) if os.path.isdir(FOLDER) else {'pages': []}
PAGES = {(p['runtime_row'], p['facing']): p for p in MF['pages']}


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def split(vals, k):
    """the indices of `vals` cut into k groups at the k-1 widest gaps of their sorted order"""
    o = sorted(range(len(vals)), key=lambda i: vals[i])
    if k <= 1:
        return [o]
    gaps = sorted(range(len(o) - 1), key=lambda j: vals[o[j + 1]] - vals[o[j]])[-(k - 1):]
    out, cur = [], []
    for j, i in enumerate(o):
        cur.append(i)
        if j in gaps:
            out.append(cur); cur = []
    out.append(cur)
    return out


_CACHE = {}


def drawings(act, v):
    """-> (page rgb float32, [mask of each frame in MANIFEST order, page-sized bool]) for a row and view"""
    if (act, v) in _CACHE:
        return _CACHE[(act, v)]
    p = PAGES[(act, v)]
    pg = np.asarray(Image.open(os.path.join(FOLDER, *p['source']['file'].split('/'))).convert('RGB')).astype(np.float32)
    bg = np.median(np.concatenate([pg[:, :4].reshape(-1, 3), pg[:, -4:].reshape(-1, 3), pg[:4].reshape(-1, 3), pg[-4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(pg - bg, axis=2) < TOL
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(edge))
    hl, hn = ndimage.label(near & ~out)
    hs = ndimage.sum(near & ~out, hl, range(1, hn + 1))
    out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fl, fn = ndimage.label(~out, structure=np.ones((3, 3)))
    sz = ndimage.sum(~out, fl, range(1, fn + 1)); objs = ndimage.find_objects(fl)
    bands = p['bands']; n = sum(len(b) for b in bands)
    lite = pg.min(-1) > 150
    glyph = lambda i: (objs[i][0].stop - objs[i][0].start) < 90 and (objs[i][1].stop - objs[i][1].start) < 90 and lite[objs[i]][fl[objs[i]] == i + 1].mean() > 0.5
    big = [i for i in range(fn) if sz[i] >= BIG * sz.max() and not glyph(i)]   # (bodies and big pieces -- an axe apart, the boulder; not a printed number (a small light glyph: SE Walk's "8" passed the size) or a speck)
    bigm = np.isin(fl, [i + 1 for i in big])

    def runs(occ, k):
        """the k spans of `occ` (a 1-d occupied profile) left when it is cut at its k-1 widest empty gaps"""
        idx = np.where(occ)[0]; segs, s0 = [], idx[0]
        for a, b in zip(idx[:-1], idx[1:]):
            if b > a + 1:
                segs.append((s0, a + 1)); s0 = b
        segs.append((s0, idx[-1] + 1))
        assert len(segs) >= k, (act, v, 'fewer spans than wanted', len(segs), k)
        gaps = sorted(range(len(segs) - 1), key=lambda j: segs[j + 1][0] - segs[j][1])[-(k - 1):] if k > 1 else []
        out_, a0 = [], segs[0][0]
        for j in range(len(segs)):
            if j in gaps or j == len(segs) - 1:
                out_.append((a0, segs[j][1]))
                if j + 1 < len(segs):
                    a0 = segs[j + 1][0]
        return out_
    frames = {}
    for bi, (y0, y1) in enumerate(runs(bigm.any(1), len(bands))):
        for num, (x0, x1) in zip(bands[bi], runs(bigm[y0:y1].any(0), len(bands[bi]))):
            frames[num] = [i for i in big if y0 <= 0.5 * (objs[i][0].start + objs[i][0].stop) < y1 and x0 <= 0.5 * (objs[i][1].start + objs[i][1].stop) < x1]
            assert frames[num], (act, v, 'nothing drawn at frame', num)
    assert sorted(frames) == list(range(1, n + 1)), (act, v, sorted(frames))
    boxes = {}
    for num, ids in frames.items():
        sls = [objs[i] for i in ids]
        boxes[num] = (slice(min(s[0].start for s in sls), max(s[0].stop for s in sls)), slice(min(s[1].start for s in sls), max(s[1].stop for s in sls)))
    for i in range(fn):
        if i in big or sz[i] < MINA:
            continue
        sl = objs[i]; pcy, pcx = 0.5 * (sl[0].start + sl[0].stop), 0.5 * (sl[1].start + sl[1].stop)
        best, bd = None, 1e9
        for num, b in boxes.items():
            dx = max(0, b[1].start - sl[1].stop, sl[1].start - b[1].stop); dy = max(0, b[0].start - sl[0].stop, sl[0].start - b[0].stop)
            if max(dx, dy) < bd:
                best, bd = num, max(dx, dy)
        b = boxes[best]
        low = pcy > b[0].start + 0.6 * (b[0].stop - b[0].start)
        if bd <= max(PAD, 0.15 * (b[0].stop - b[0].start)) and sl[0].start < b[0].stop - 4 and not (glyph(i) and low):   # (near -- a breath's fog drifts off his mouth -- and not a printed number: under the soles, or a light glyph low by them)
            frames[best].append(i)
    masks = [np.isin(fl, [j + 1 for j in frames[num]]) for num in range(1, n + 1)]
    if act == 'idle':
        pg = pg.copy(); defog(pg, masks, v)
    _CACHE[(act, v)] = (pg, masks)
    return _CACHE[(act, v)]


ROOTS = {}                      # {view: [(y, x, frame, fog px, cloud y, cloud x): the drawn fog's root at the lips and its cloud's middle, page px, a fogged frame each]}


def defog(pg, masks, v):
    """THE BREATH FOG OUT (11-15, Griz on the hell hound's drawn smoke, "should be done with the engine like we're doing other things", then "1-3 leans": the giant's
    drawn breath stripped, the engine draws it -- deep16/js/looks.js LK.exhale). Idle 2-4 draw a puff, a cloud and its wisps; Idle 1 draws none. Each later frame is
    laid on Idle 1 by the body (the lower 60%: the middle of its columns, the soles); the fog is what is light and grey in its top 45% that Idle 1 has nowhere near
    (5 px), and the soft edge round it that Idle 1 does not match; where the fog lay over him (the axe, the beard) Idle 1's own pixels go back, elsewhere it is navy.
    Where the fog meets his face is kept (ROOTS): the engine's breath starts there. In place, on the page"""
    lite = lambda a: (a.min(-1) > 140) & ((a.max(-1) - a.min(-1)) < 55)
    y0r, y1r, x0r, x1r = tight(masks[0])

    def body(m):
        y0, y1, x0, x1 = tight(m); lo = m.copy(); lo[:y0 + int(0.4 * (y1 - y0))] = False
        return y1, ndimage.center_of_mass(lo)[1]
    sr, cr = body(masks[0])
    ref_rgb = pg[y0r:y1r, x0r:x1r].copy(); ref_m = masks[0][y0r:y1r, x0r:x1r]
    ROOTS[v] = []
    for k in range(1, len(masks)):
        m = masks[k]; sk_, ck = body(m); dy, dx = int(round(sk_ - sr)), int(round(ck - cr))
        y0, y1, x0, x1 = tight(m); H = y1 - y0
        R = np.zeros(m.shape, bool); Rrgb = np.zeros(pg.shape, np.float32)       # (Idle 1, moved onto this frame)
        ty0, tx0 = y0r + dy, x0r + dx
        ys0, xs0 = max(0, ty0), max(0, tx0); ys1, xs1 = min(m.shape[0], ty0 + ref_m.shape[0]), min(m.shape[1], tx0 + ref_m.shape[1])
        R[ys0:ys1, xs0:xs1] = ref_m[ys0 - ty0:ys1 - ty0, xs0 - tx0:xs1 - tx0]; Rrgb[ys0:ys1, xs0:xs1] = ref_rgb[ys0 - ty0:ys1 - ty0, xs0 - tx0:xs1 - tx0]
        top = np.zeros(m.shape, bool); top[:y0 + int(0.45 * H)] = True
        fog = m & lite(pg) & ~ndimage.binary_dilation(R & lite(Rrgb), iterations=5) & top     # (the cloud's light body: its root is found by it)
        if fog.sum() < 30:
            continue
        hair = R & (Rrgb.min(-1) > 200) & ((Rrgb.max(-1) - Rrgb.min(-1)) < 30); hair[y0 + int(0.25 * H):] = False
        hy, hx = ndimage.center_of_mass(hair) if hair.any() else (y0, 0.5 * (x0 + x1))
        fy, fx = np.where(fog); dd = np.hypot(fy - hy, fx - hx); near = dd <= dd.min() + 6
        ROOTS[v].append((fy[near].mean(), fx[near].mean(), k, int(fog.sum()), fy.mean(), fx.mean()))   # (page px: the fog nearest the middle of his hair, and the cloud's middle -- the way it drifts)
        out_ = m & top & ~ndimage.binary_dilation(R, iterations=4)                 # (in his head's height, outside Idle 1's figure: the fog and its dark outline, gone)
        diff = m & top & R & (lite(pg) & ~lite(Rrgb) | (np.abs(pg - Rrgb).max(-1) > 60))  # (over him, what Idle 1 does not have there: Idle 1's own pixels back)
        pg[diff] = Rrgb[diff]
        m &= ~out_


def tight(m):
    ys, xs = np.where(m); return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def dims(act, v):
    return [(lambda t: (t[3] - t[2], t[1] - t[0]))(tight(m)) for m in drawings(act, v)[1]]


def fits():
    """{(act, view): k} each row's scale against its view's Idle; base {view: TALL / that Idle's median height}"""
    H = {(a, v): [h for w, h in dims(a, v)] for a in ACTS for v in VIEWS}
    base = {v: TALL / float(med(H[('idle', v)])) for v in VIEWS}
    F = {}
    for v in VIEWS:
        ih = med(H[('idle', v)])
        F[('idle', v)] = 1.0
        F[('attack', v)] = ih / float(H[('attack', v)][0])
        F[('flinch', v)] = ih / float(med([H[('flinch', v)][0], H[('flinch', v)][3]]))
        F[('hurt', v)] = ih / float(H[('hurt', v)][0])
        F[('walk', v)] = WALK_DIP * ih / float(med(H[('walk', v)]))
        F[('throw', v)] = ih / float(H[('throw', v)][5])
        F[('prone', v)] = F[('hurt', v)]
    return base, F, H


MOUTH = {}


def cut(check=False):
    base, F, H = fits()
    cells = {}
    for name, fps, keys in ROWS:
        for (act, i) in keys:
            for v in VIEWS:
                if (DS.FACE[v], act, i) in cells:
                    continue
                pg, ms = drawings(act, v)
                y0, y1, x0, x1 = tight(ms[i])
                k = base[v] * F[(act, v)]
                o = DS.to1x(pg[y0:y1, x0:x1], ms[i][y0:y1, x0:x1], k, AVOID)
                al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
                if (act, i) in LYING:
                    cx = ndimage.center_of_mass(al)[1]; foot = ys[-1]
                else:                                                     # (his boots: the warm leather in the lower half -- not the axe's grey steel, which
                    rgb = o[..., :3].astype(int)                          # chops down past his soles on Greataxe 4)
                    warm = al & (rgb[..., 0] > rgb[..., 2] + 8); warm[:ys[0] + (ys[-1] - ys[0]) // 2] = False
                    foot = np.where(warm.any(1))[0].max()
                    ft = warm.copy(); ft[:foot - max(2, int(round((ys[-1] - ys[0]) * FEET)))] = False
                    cx = ndimage.center_of_mass(ft)[1]
                cells[(DS.FACE[v], act, i)] = (o, cx, foot)
                if act == 'idle':                                         # (the drawn fog's root on this frame, into the cell: x from the anchor, y from the ground line)
                    for ry, rx, kf, npx, cy_, cx_ in sorted(ROOTS.get(v, []), key=lambda r: -r[3])[:1]:   # (the cloud's root, Idle 3's: a later frame's wisps drift off the lips)
                        if kf == i:
                            dl = max(1e-6, float(np.hypot(cy_ - ry, cx_ - rx)))
                            MOUTH.setdefault(DS.FACE[v], []).append(((rx - x0) * k + 1 - cx, (ry - y0) * k + 1 - foot, (cx_ - rx) / dl, (cy_ - ry) / dl))
    for mf, sf in DS.MIRROR.items():
        if sf in MOUTH:
            MOUTH[mf] = [(-x, y, -dx, dy) for x, y, dx, dy in MOUTH[sf]]
    for mf, sf in DS.MIRROR.items():
        for (f, act, i) in [c for c in list(cells) if c[0] == sf]:
            o, cx, foot = cells[(f, act, i)]
            cells[(mf, act, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        got = [cells[(f,) + tuple(k_)] for f in range(8) for k_ in keys]
        reach = max(max(cx, o.shape[1] - cx) for (o, cx, foot) in got)
        up = max(foot for (o, cx, foot) in got) + 2                         # (the ground line's row in the cell: the tallest frame's head room)
        dn = max(o.shape[0] - 1 - foot for (o, cx, foot) in got) + 2
        fw, fh, ax, ay = int(2 * np.ceil(reach + 2)), int(up + dn + 1), int(np.ceil(reach + 2)), int(up)
        blk = np.zeros((8 * fh, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k_ in enumerate(keys):
                o, cx, foot = cells[(f,) + tuple(k_)]
                dx, dy = int(round(ax - cx)), ay - foot
                h, w = o.shape[:2]
                assert dy >= 0 and dy + h <= fh and dx >= 0 and dx + w <= fw, (name, f, k_, 'a frame past its cell', dx, dy, w, h)
                dst = blk[f * fh + dy:f * fh + dy + h, j * fw + dx:j * fw + dx + w]
                put = o[..., 3] > 0; dst[put] = o[put]
        a = dict(y=y, fw=fw, fh=fh, ax=ax, ay=ay, frames=len(keys), fps=fps)
        if name in RELEASE:
            a['release'] = RELEASE[name]
        if name == 'idle':                                                # (where his breath leaves him, a facing each: deep16/js/looks.js LK.exhale)
            assert len(MOUTH) == 8, ('no drawn fog to find the mouth by in', sorted(MOUTH))
            a['mouth'] = [[int(round(MOUTH[f][0][0])), int(round(MOUTH[f][0][1])), round(float(MOUTH[f][0][2]), 2), round(float(MOUTH[f][0][3]), 2)] for f in range(8)]   # ([x, y, the drawn cloud's way out: dx, dy])
        anims[name] = a; blocks.append(blk); y += 8 * fh
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=TALL, anims=anims, name='Frost Giant', hold=HOLD, source=SOURCE)
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s' % (NAME, W, y, ', '.join('%s %d@%dx%d' % (n_, a_['frames'], a_['fw'], a_['fh']) for n_, a_ in anims.items())))
    print('  base %s; fits %s' % (', '.join('%s %.4f' % (v, base[v]) for v in VIEWS), ', '.join('%s %s %.3f' % (a_, v, F[(a_, v)]) for (a_, v) in sorted(F) if a_ != 'idle')))
    if check:
        Z = 2; out = os.path.join(ROOT, 'deep16', 'art-src', 'frostgiant'); os.makedirs(out, exist_ok=True)
        tiles = []
        for name, fps, keys in ROWS:
            a = anims[name]
            for f in [0, 7, 6, 5, 4, 1, 2, 3]:
                tiles.append(sheet[a['y'] + f * a['fh']:a['y'] + (f + 1) * a['fh'], :a['fw'] * a['frames']])
        Hh = sum(t.shape[0] for t in tiles)
        rv = Image.new('RGBA', (W * Z, Hh * Z), (12, 20, 40, 255)); yy = 0
        for t in tiles:
            rv.alpha_composite(Image.fromarray(np.ascontiguousarray(t), 'RGBA').resize((t.shape[1] * Z, t.shape[0] * Z), Image.NEAREST), (0, yy * Z)); yy += t.shape[0]
        rv.save(os.path.join(out, NAME + '-review.png'), optimize=True)
        print('review:', os.path.join(out, NAME + '-review.png'))
    return sheet, anims


if __name__ == '__main__':
    if 'dims' in sys.argv:
        base, F, H = fits()
        for v in VIEWS:
            print(v, ' '.join('%s %s' % (a, [int(h) for h in H[(a, v)]]) for a in ACTS))
        print('base %s' % base)
        print(', '.join('%s %s %.3f' % (a, v, F[(a, v)]) for (a, v) in sorted(F) if a != 'idle'))
    else:
        cut('check' in sys.argv)
