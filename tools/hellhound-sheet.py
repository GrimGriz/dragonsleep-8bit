"""DEEP16 pipeline 2 (generated art): the hell hound, the SRD's Medium fiend -> deep16/art/hellhound_p1, all eight facings.

    python tools/hellhound-sheet.py            (writes deep16/art/hellhound_p1.png/.json)
    python tools/hellhound-sheet.py check      (also deep16/art-src/hellhound/hellhound_p1-review.png: every row of every facing at 3x)
    python tools/hellhound-sheet.py debug      (only deep16/art-src/hellhound/strip-<view>-<row>.png: what is taken for smoke (red) and outer fire (yellow))

Asked in art-wanted section 64 (11-15, the lanes desk, on Griz's "let's get one in each column ... a request for one fiend, construct, celestial and fey"): the fiend;
cut 11-15 by the cutter-fresh-1115 seat on the lanes desk's queue (his "Please start cutting Fresh one at a time"). The art desk's ART-WANTED-64-HELL-HOUND, sorted
out of Fresh to deep16/_src/hellhound/2026-11-15-ART-WANTED-64-SOURCES/ (the zip beside it): a page a view and row -- HEAD 1 S, 2 SE, 3 E, 4 the rear NE, 5 N --
Idle 8, Run 8, Bite 8, Fire Breath 8, Flinch 6, Fall 8, Prone 2; 240 drawings, none missing. Its frame-map.json boxes each drawing (effects and all); a window here
is that box padded PAD a side, cut by tools/doran-sheet.py's figure (the navy flooded from the window's edges; the page's titles, captions and numbers stand
outside the boxes) and snap.

THE SMOKE AND THE FIRE OFF (Griz, 11-15, on this hound's drawn smoke: "i thought it would look silly like that animated and should be done with the engine like
we're doing other things"; the art desk's own notes ask the same: "Remove all jaw smoke and wisps", the Bite's "external flare", "all flame outside the mouth"):
on each drawing the hound's BODY is its figure less the smoke's greys and the fire's oranges and yellows, its biggest piece with its holes filled; smoke and fire
more than REACH page px off that body go (the ember eyes and the lit gums, tongue and throat lie on it and stay), and so does any piece left apart from it. The
Flinch's pale reaction strokes over the back (E, NE 2) go with them. Where the idle's drawn smoke leaves the jaws, and the way it rises, is kept: the Idle row's
`mouth`, a facing each -- deep16/js/looks.js LK.exhale breathes 'smoke' from there (data/foes.js hellhound `exhale`), as RULED 11-15 (his "1 keep").

Scale: TALL, the art desk's own standing target (30 px, "following the Medium wolf cut"). Each view's Idle to it by its median height, with the smoke off; each
other page by its standing frames -- Bite 1 and Fire Breath 1 ("Guard"), Flinch 1, Fall 1 -- the Run by its median height, the Prone by Prone 1's width to Fall 7's.
A standing frame stands on its feet (the middle of its lowest 12%); a lying one (Fall 6-8, the Prone) by its whole body's middle. Each row its own cell.

Rows: idle 8; walk 8 <- Run; bite 8 (js/battle.js plays the row named for the attack; `release` 3: the snap on frame 4 -- the engine's fire on the hit);
breath 8 (js/traits.js M.breathe plays it; `release` 3: the jaws open on frame 4, the cone the engine's); flinch 6; hurt 8 (Fall: the glow goes out over its last
three); prone 2 (Fall 6, Prone 1: down, the glow still in it -- js/sprites.js S.proneRow); getup 1 (Prone 2: up).
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
pix = DS.pix

FOLDER = os.path.join(pix.SRC, 'hellhound', '2026-11-15-ART-WANTED-64-SOURCES')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'hellhound', os.path.basename(FOLDER))
NAME = 'hellhound_p1'
TALL = 30
PAD = 10
REACH = 2                       # (page px: fire farther than this off the body goes -- the lit gums and eyes lie inside it)
WISP = 12                       # (page px: a grey piece reaching farther than this off the body is smoke)
RING = 14                       # (page px: round fire outside the body, its outline goes too)
HOLD3 = ('S',)                  # (S's cone pours at the eye, over its own chest, and under it the hound is not drawn: its Fire Breath 4-6 hold its Breath 3, the glow risen)
FEET = 0.12
AVOID = []
VIEWS = ['S', 'SE', 'E', 'NE', 'N']
ACTS = ['idle', 'walk', 'bite', 'breath', 'flinch', 'hurt', 'prone']
LYING = {('hurt', 5), ('hurt', 6), ('hurt', 7), ('prone', 0), ('prone', 1)}
ROWS = [('idle', 6, [('idle', i) for i in range(8)]), ('walk', 12, [('walk', i) for i in range(8)]), ('bite', 10, [('bite', i) for i in range(8)]),
        ('breath', 8, [('breath', i) for i in range(8)]), ('flinch', 12, [('flinch', i) for i in range(6)]), ('hurt', 8, [('hurt', i) for i in range(8)]),
        ('prone', 8, [('hurt', 5), ('prone', 0)]), ('getup', 6, [('prone', 1)])]
RELEASE = {'bite': 3, 'breath': 3}
HOLD = ['S and N Run: the head-on and rear views foreshorten the stride (the art desk\'s own notes)']
SOURCE = ('drawn by the art desk (ART-WANTED-64-HELL-HOUND, 11-15: art-wanted section 64), cut by tools/hellhound-sheet.py, its drawn smoke and outer fire off; '
          'SW W NW mirrored -- the SRD 5.1 Hell Hound: deep16/data/foes.js hellhound')

FM = json.load(open(os.path.join(FOLDER, 'frame-map.json'), encoding='utf-8')) if os.path.isdir(FOLDER) else {'sheets': []}
SHEETS = {(s['runtime_row'], s['facing']): s for s in FM['sheets']}


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def smoke_of(a):
    """a cool grey: the drawn smoke -- blue a little over red (+15 to +17 measured), where the coat, soot and rust alike, is warm (blue under red by about 20)"""
    return (a[..., 2] - a[..., 0] >= 6) & (a.max(-1) > 55)


def fire_of(a):
    """orange to yellow: the drawn fire (the ember eyes and the lit mouth too -- they lie on the body)"""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 130) & (r - b > 100)                                      # (the flames' deep orange edges too; the rust coat's red runs under blue by 40 to 80)


_PAGES = {}
STRIP = {}                      # {(act, view, i): (smoke px, fire px)}
ROOTS = {}                      # {view: (root y, root x, cloud y, cloud x, smoke px, frame) in window px of the drawing}


def drawing(act, v, i):
    """-> (rgb, mask): a drawing, tight, its smoke and outer fire off"""
    s = SHEETS[(act, v)]
    if act == 'breath' and v in HOLD3 and i in (3, 4, 5):
        i = 2
    fr = s['frames'][i]
    fn = os.path.join(FOLDER, *s['source_png'].split('/'))
    if fn not in _PAGES:
        _PAGES[fn] = np.asarray(Image.open(fn).convert('RGB')).astype(np.float32)
    pg = _PAGES[fn]
    x0, y0, x1, y1 = fr['source_bbox_xyxy_exclusive']
    X0, Y0, X1, Y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(pg.shape[1], x1 + PAD), min(pg.shape[0], y1 + PAD)
    a = pg[Y0:Y1, X0:X1]
    m = DS.figure(a, below=True)
    sm, fi = smoke_of(a) & m, fire_of(a) & m
    core = m & ~sm & ~fi
    lab, n = ndimage.label(core, structure=np.ones((3, 3)))
    body = ndimage.binary_fill_holes(lab == 1 + int(np.argmax(ndimage.sum(core, lab, range(1, n + 1)))))
    near = ndimage.binary_dilation(body, iterations=REACH)
    dist = ndimage.distance_transform_edt(~body)
    sl_, sn_ = ndimage.label(sm & ~body, structure=np.ones((3, 3)))       # (a grey piece is smoke when it reaches WISP px off the body: a claw's or an ear's grey hugs it)
    wisp = np.isin(sl_, [k for k in range(1, sn_ + 1) if dist[sl_ == k].max() > WISP])
    sm = sm & (wisp | body)
    # (a flame's dark outline joins the jaws and can ring the cone, so the filled body takes the cone in: the body is found again after an opening that breaks a thin
    #  line, and the fire outside it goes with what lies within RING px of that fire -- its outline)
    op = ndimage.binary_opening(core, structure=np.ones((3, 3)), iterations=2)
    lo, no = ndimage.label(op, structure=np.ones((3, 3)))
    body0 = ndimage.binary_dilation(lo == 1 + int(np.argmax(ndimage.sum(op, lo, range(1, no + 1)))), iterations=3) if no else body
    out_f = fi & ~body0
    ring = m & ~body0 & ndimage.binary_dilation(out_f, iterations=RING)
    keep = m & ~wisp & ~(fi & ~near) & ~ring                              # (the smoke off; the fire kept within REACH -- the jaws' own glow -- and none outside the body)
    lab2, n2 = ndimage.label(keep, structure=np.ones((3, 3)))
    if n2 > 1:
        keep = np.isin(lab2, [k for k in range(1, n2 + 1) if ((lab2 == k) & body).any()])
    gone_s, gone_f = m & sm & ~keep, m & fi & ~keep
    STRIP[(act, v, i)] = (int(gone_s.sum()), int(gone_f.sum()))
    if act == 'idle' and gone_s.sum() >= 20:                              # (where the jaws are -- the lit gums, the lowest of the glow on the body (the eyes sit higher) --
        sy, sx = np.where(gone_s)                                         #  and the way the drawn smoke goes from there)
        gy, gx = np.where(fi & body)                                      # (the lit gums: the lowest of the glow on the body -- the eyes sit higher; where no glow shows
        if len(gy) >= 4:                                                  #  (SE), the smoke's lowest end -- smoke rises from the jaws)
            lowg = gy >= gy.min() + 0.55 * (gy.max() - gy.min()); ry, rx = gy[lowg].mean(), gx[lowg].mean()
        else:
            nr = sy >= sy.max() - 3; ry, rx = sy[nr].mean(), sx[nr].mean()
        r = (ry, rx, sy.mean(), sx.mean(), int(gone_s.sum()), i)
        if v not in ROOTS or r[4] > ROOTS[v][4]:
            ROOTS[v] = r
    ys, xs = np.where(keep)
    sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    if act == 'idle' and v in ROOTS and ROOTS[v][5] == i:                 # (the root into the tight box's frame)
        ry, rx, cy, cx, n_, k_ = ROOTS[v]; ROOTS[v] = (ry - sl[0].start, rx - sl[1].start, cy - sl[0].start, cx - sl[1].start, n_, k_)
    return a[sl], keep[sl], (a, m, gone_s, gone_f)


def fits():
    H = {}
    for act in ACTS:
        for v in VIEWS:
            H[(act, v)] = [drawing(act, v, i)[1].shape[0] for i in range(len(SHEETS[(act, v)]['frames']))]
    W7 = {v: drawing('hurt', v, 6)[1].shape[1] for v in VIEWS}
    base = {v: TALL / float(med(H[('idle', v)])) for v in VIEWS}
    F = {}
    for v in VIEWS:
        ih = med(H[('idle', v)])
        F[('idle', v)] = 1.0
        F[('walk', v)] = ih / float(med(H[('walk', v)]))
        F[('bite', v)] = ih / float(H[('bite', v)][0])
        F[('breath', v)] = ih / float(H[('breath', v)][0])
        F[('flinch', v)] = ih / float(H[('flinch', v)][0])
        F[('hurt', v)] = ih / float(H[('hurt', v)][0])
        F[('prone', v)] = F[('hurt', v)] * W7[v] / float(drawing('prone', v, 0)[1].shape[1])
    return base, F


MOUTH = {}
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}


def cut(check=False):
    base, F = fits()
    cells = {}
    for name, fps, keys in ROWS:
        for (act, i) in keys:
            for v in VIEWS:
                if (FACE[v], act, i) in cells:
                    continue
                rgb, m, _ = drawing(act, v, i)
                k = base[v] * F[(act, v)]
                o = DS.to1x(rgb, m, k, AVOID)
                al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
                if (act, i) in LYING:
                    cx = ndimage.center_of_mass(al)[1]
                else:
                    ft = al.copy(); ft[:ys[-1] - max(2, int(round((ys[-1] - ys[0]) * FEET)))] = False
                    cx = ndimage.center_of_mass(ft)[1]
                foot = ys[-1]
                cells[(FACE[v], act, i)] = (o, cx, foot)
                if act == 'idle' and v in ROOTS and ROOTS[v][5] == i:
                    ry, rx, sy, sx, n_, _ = ROOTS[v]
                    dl = max(1e-6, float(np.hypot(sy - ry, sx - rx)))
                    MOUTH[FACE[v]] = [int(round(rx * k + 1 - cx)), int(round(ry * k + 1 - foot)), round(float((sx - rx) / dl), 2), round(float((sy - ry) / dl), 2)]
    for mf, sf in MIRROR.items():
        if sf in MOUTH:
            x, y, dx, dy = MOUTH[sf]; MOUTH[mf] = [-x, y, -dx, dy]
        for (f, act, i) in [c for c in list(cells) if c[0] == sf]:
            o, cx, foot = cells[(f, act, i)]
            cells[(mf, act, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        got = [cells[(f,) + tuple(k_)] for f in range(8) for k_ in keys]
        reach = max(max(cx, o.shape[1] - cx) for (o, cx, foot) in got)
        up = max(foot for (o, cx, foot) in got) + 2
        dn = max(o.shape[0] - 1 - foot for (o, cx, foot) in got) + 2
        fw, fh, ax, ay = int(2 * np.ceil(reach + 2)), int(up + dn + 1), int(np.ceil(reach + 2)), int(up)
        blk = np.zeros((8 * fh, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k_ in enumerate(keys):
                o, cx, foot = cells[(f,) + tuple(k_)]
                dx, dy = int(round(ax - cx)), ay - foot
                h, w = o.shape[:2]
                assert dy >= 0 and dy + h <= fh and dx >= 0 and dx + w <= fw, (name, f, k_, 'a frame past its cell')
                dst = blk[f * fh + dy:f * fh + dy + h, j * fw + dx:j * fw + dx + w]
                put = o[..., 3] > 0; dst[put] = o[put]
        a = dict(y=y, fw=fw, fh=fh, ax=ax, ay=ay, frames=len(keys), fps=fps)
        if name in RELEASE:
            a['release'] = RELEASE[name]
        if name == 'idle':
            assert len(MOUTH) == 8, ('no drawn smoke to find the jaws by in', sorted(MOUTH))
            a['mouth'] = [MOUTH[f] for f in range(8)]
        anims[name] = a; blocks.append(blk); y += 8 * fh
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=TALL, anims=anims, name='Hell Hound', hold=HOLD, source=SOURCE)
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    tot = lambda j: sum(v[j] for v in STRIP.values())
    print('%s: %dx%d, rows %s' % (NAME, W, y, ', '.join('%s %d@%dx%d' % (n_, a_['frames'], a_['fw'], a_['fh']) for n_, a_ in anims.items())))
    print('  stripped: smoke %d px, outer fire %d px (page px); mouths %s' % (tot(0), tot(1), [MOUTH[f] for f in range(8)]))
    print('  base %s; fits %s' % (', '.join('%s %.4f' % (v, base[v]) for v in VIEWS), ', '.join('%s %s %.2f' % (a_, v, F[(a_, v)]) for (a_, v) in sorted(F) if a_ != 'idle')))
    if check:
        Z = 3; out = os.path.join(ROOT, 'deep16', 'art-src', 'hellhound'); os.makedirs(out, exist_ok=True)
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


def debug(out):
    """each view's Idle, Bite and Fire Breath page drawings, smoke taken marked red, outer fire yellow, kept as drawn: a strip a row"""
    os.makedirs(out, exist_ok=True)
    for act in ('idle', 'bite', 'breath', 'flinch'):
        for v in VIEWS:
            tiles = []
            for i in range(len(SHEETS[(act, v)]['frames'])):
                _, _, (a, m, gs, gf) = drawing(act, v, i)
                im = np.zeros(a.shape, np.uint8) + np.array([14, 20, 48], np.uint8)
                im[m] = a[m].astype(np.uint8); im[gs] = (255, 0, 0); im[gf] = (255, 255, 0)
                tiles.append(Image.fromarray(im).resize((im.shape[1] // 3, im.shape[0] // 3)))
            H = max(t.height for t in tiles); W = sum(t.width for t in tiles)
            o = Image.new('RGB', (W, H), (0, 0, 0)); x = 0
            for t in tiles:
                o.paste(t, (x, 0)); x += t.width
            o.save(os.path.join(out, 'strip-%s-%s.png' % (v, act)))
    print('debug strips:', out)


if __name__ == '__main__':
    if 'debug' in sys.argv:
        debug(sys.argv[sys.argv.index('debug') + 1] if len(sys.argv) > sys.argv.index('debug') + 1 else os.path.join(ROOT, 'deep16', 'art-src', 'hellhound'))
    else:
        cut('check' in sys.argv)
