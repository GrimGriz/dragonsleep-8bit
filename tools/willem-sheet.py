"""DEEP16 pipeline 2 (generated art): Willem Glass, the illusionist -> willemglass_p2 (his fight figure) and willemmounted_p1 (riding a grey), all eight facings.

    python tools/willem-sheet.py [willemglass_p2|willemmounted_p1]     (writes deep16/art/<name>.png/.json; both with no name)
    python tools/willem-sheet.py [name] check                          (also deep16/art-src/willem/<name>-review.png)

Asked in art-wanted section 35 (11-04, the Inn seat; Griz 10-30: "we'll need pose requests to replace willem and amara in combat as well as inn NPCs";
block 8, the pair mounted, the lanes desk 11-04); cut 11-05 by the Waterby cutter (waterby-cutter-1105) on the lanes desk's relay of Griz's "Got Willem
in Fresh and can push live to main once that art is slotted". The art desk's three batches, sorted to deep16/_src/willem/:
  INN-COMBAT-SE-1105  HALFWAY-INN-WILLEM-COMBAT-SE: HEAD 7 SE, two pages -- PAGE 1 Idle 6, Walk 8, Run 8; PAGE 2 Cast 6, Traces 6, Flinch 4, Fall 4, Prone 1.
  INN-COMBAT-1105     HALFWAY-INN-WILLEM-COMBAT-REMAINING: HEAD 8 NE, 9 S, 10 E, 11 N, the same two pages a view.
  INN-MOUNTED-1105    HALFWAY-INN-WILLEM-MOUNTED: HEAD 1 SE, 2 NE, 3 S, 4 E, 5 N, one page a view -- Ride 6 over Halt 1, horse and rider one drawing.
The art desk's FRAME-MAP.json names each drawing by band and column, no pixel windows: find_frames() reads the page -- the navy by its edges, the printed
labels and numbers left out as small pieces, the drawings grouped into the page's bands top to bottom and each band split at its widest gaps into its
count. Each window is then cut as tools/doran-sheet.py cuts (loaded here).

willemglass_p2 (every fight with him: deep16/data/foes.js willem -- the wagon night's yard, the road catches, the chase on foot), in place of the mannequin
render willemglass_p1 (kept; js/classes.js NPC.NAMED.willem's look too): idle <- Idle 6; walk <- Walk 8; run <- Run 8 (the chase plays it: js/chase.js; it
keeps its lift, standing on its band's floor -- `LIFT`); cast <- Cast 6 (`release` 2: both hands up and apart on frame 3; the game draws his Mirror Image
and Ray of Frost); attack <- the same Cast 6 (no staff, no wand: "the hands are the instrument" -- a blow of his is a flourish); traces <- Traces 6 (at
the team's buckles: js/ui.js plays it while u.traces holds); flinch <- Flinch 4; hurt <- Fall 4; prone <- Fall 2-4 then Prone 1 (js/sprites.js
S.proneRow). One scale a page (the art desk: page 2 drawn smaller than page 1): page 1 by its Idle, page 2 by its standing frames (Cast 1 and 6,
Traces 1, Flinch 4), each to TALL. A standing frame on its lowest row by its torso's middle, one on the ground (Fall 3-4, Prone) by its whole body's.
willemmounted_p1 (NOT WIRED: nothing draws a mounted unit yet -- js/chase.js sets u.mounted and the greys' speed, no figure; amaramounted_p1 waits the
same): idle <- the Halt, walk <- the six-frame Ride, as tools/amara-mounted-sheet.py: horsegrey_p1's length nose to tail sets the E Halt's, every view's
Halt then stands the E Halt's height; the gallop keeps its lift (each frame on its band's floor). Facings (RULED 10-14): S SE E NE N as drawn, SW W NW
their mirrors. Boxed down, snapped to the 64 (red and fire left out), outlined.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doran_sheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
pix = DS.pix
_W = os.path.join(pix.SRC, 'willem')
PAD = 8
TOL = 10        # (the page's navy: 99% of its border within 3 of its median, none past 9; his coat's darks 12 to 30 off it)


def find_frames(path, bands, shadow=True):
    """{(row, i): (box, floor)} -- the drawings on a page by its bands (top to bottom: [(row, count)]); a box padded by PAD, `floor` its band's lowest row"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    lt = DS.letters(a, (), TOL)
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3), a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < TOL
    flood = near.copy()
    if shadow:
        br = a[..., 2] - a[..., 0]
        flood |= (a.max(-1) < 38) & (br >= 6) & (br <= 28) & (a[..., 1] <= a[..., 2])
    lab, n = ndimage.label(flood)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ~np.isin(lab, list(edge)) & ~lt
    fl, fn = ndimage.label(fg, structure=np.ones((3, 3)))
    sz = ndimage.sum(fg, fl, range(1, fn + 1)); objs = ndimage.find_objects(fl)
    hmax = max(o_[0].stop - o_[0].start for o_ in objs)
    lite = (a.min(-1) > 150) & (a.max(-1) - a.min(-1) < 45)
    def label(i):                                        # (a row's label: short, and mostly white or light grey lettering -- a figure lying down is short, not lettering)
        o_ = objs[i]; return o_[0].stop - o_[0].start < hmax / 3.0 and lite[o_][fl[o_] == i + 1].mean() > 0.25
    big = [(objs[i], sz[i]) for i in range(fn) if sz[i] >= 0.06 * sz.max() and not label(i)]
    big.sort(key=lambda t: t[0][0].start)
    groups = []                                            # (the bands: pieces whose rows overlap a band's by a third of the smaller go in it)
    for sl, s in big:
        y0, y1 = sl[0].start, sl[0].stop
        for g in groups:
            ov = min(y1, g['y1']) - max(y0, g['y0'])
            if ov > 0.33 * min(y1 - y0, g['y1'] - g['y0']):
                g['p'].append(sl); g['y0'] = min(g['y0'], y0); g['y1'] = max(g['y1'], y1); break
        else:
            groups.append(dict(y0=y0, y1=y1, p=[sl]))
    groups.sort(key=lambda g: g['y0'])
    if len(groups) != len(bands):
        raise SystemExit('%s: %d bands found (%s), %d wanted' % (os.path.basename(path), len(groups), [(g['y0'], g['y1'], len(g['p'])) for g in groups], len(bands)))
    out = {}
    for (row, cnt), g in zip(bands, groups):
        ps = sorted(g['p'], key=lambda sl: sl[1].start)
        segs = [[sl] for sl in ps]
        while len(segs) > cnt:                             # (a drawing in two pieces: join across the narrowest gap)
            gaps = [min(s.start for s in [q[1] for q in segs[j + 1]]) - max(q[1].stop for q in segs[j]) for j in range(len(segs) - 1)]
            j = int(np.argmin(gaps)); segs[j:j + 2] = [segs[j] + segs[j + 1]]
        if len(segs) != cnt:
            raise SystemExit('%s %s: %d drawings, not %d' % (os.path.basename(path), row, len(segs), cnt))
        for i, sg in enumerate(segs):
            x0 = min(s[1].start for s in sg); x1 = max(s[1].stop for s in sg); y0 = min(s[0].start for s in sg); y1 = max(s[0].stop for s in sg)
            out[(row, i)] = ((x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD), g['y1'])
    return out


def windows(pages, bands, shadow=True):
    """{(row, i, view): (file, box, None, floor)} over {view: file relative to _W}"""
    w = {}
    for view, fn in pages.items():
        for (row, i), (box, floor) in find_frames(os.path.join(_W, fn), bands, shadow).items():
            w[(row, i, view)] = (fn, box, None, floor)
    return w


SE, REM = 'INN-COMBAT-SE-1105/selected/', 'INN-COMBAT-1105/selected/'
P1 = {'SE': SE + 'WILLEM_HEAD-7_PAGE-1.png', 'NE': REM + 'WILLEM_HEAD-8_PAGE-1.png', 'S': REM + 'WILLEM_HEAD-9_PAGE-1.png', 'E': REM + 'WILLEM_HEAD-10_PAGE-1.png', 'N': REM + 'WILLEM_HEAD-11_PAGE-1.png'}
P2 = {v: f.replace('PAGE-1', 'PAGE-2') for v, f in P1.items()}
MOUNT = {v: 'INN-MOUNTED-1105/selected/WILLEM_MOUNTED_HEAD-%d_PAGE-1.png' % h for v, h in (('SE', 1), ('NE', 2), ('S', 3), ('E', 4), ('N', 5))}


def fight_spec():
    return dict(SOURCES={'p1': dict(folder=_W, windows=windows(P1, [('idle', 6), ('walk', 8), ('run', 8)], False), tol=TOL, below=True),     # (no shadow key: his navy coat's dark seams read
                         'p2': dict(folder=_W, windows=windows(P2, [('cast', 6), ('traces', 6), ('flinch', 4), ('fall', 4), ('prone', 1)], False), tol=TOL, below=True)},   # as baked shadow and split him)
                GROUPS={('p1', 'all'): (['idle', 'walk', 'run'], [('idle', i) for i in range(6)]),
                        ('p2', 'all'): (['cast', 'traces', 'flinch', 'fall', 'prone'], [('cast', 0), ('cast', 5), ('traces', 0), ('flinch', 3)])},
                GROUND={('p2', 'fall', 2), ('p2', 'fall', 3), ('p2', 'prone', 0)}, LIFT=('run',), TALL=50, AVOID=['red', 'fire'], NAME='Willem Glass', SRCDIR='willem',
                LOOKS={'willemglass_p2': dict(
                    rows=[('idle', 6, [('p1', 'idle', i) for i in range(6)]), ('walk', 10, [('p1', 'walk', i) for i in range(8)]),
                          ('run', 12, [('p1', 'run', i) for i in range(8)]), ('cast', 10, [('p2', 'cast', i) for i in range(6)]),
                          ('attack', 10, [('p2', 'cast', i) for i in range(6)]), ('traces', 6, [('p2', 'traces', i) for i in range(6)]),
                          ('flinch', 12, [('p2', 'flinch', i) for i in range(4)]), ('hurt', 10, [('p2', 'fall', i) for i in range(4)]),
                          ('prone', 10, [('p2', 'fall', 1), ('p2', 'fall', 2), ('p2', 'fall', 3), ('p2', 'prone', 0)])],
                    release={'cast': 2, 'attack': 2},
                    hold=['walk: 5-8 more hurried than 1-4, SE\'s corrected; walk and run leads alike at 1 and 5 in several views (the art desk\'s own notes)',
                          'attack: his Cast row (no staff or wand drawn: the hands are the instrument)',
                          'NE, S, E and N fall 4 and prone: lying sideways or partly face down, not the exact facing (the art desk\'s own notes)'],
                    source='drawn by the art desk (HALFWAY-INN-WILLEM-COMBAT-SE and -REMAINING, 11-05: art-wanted section 35, his fight figure in five views, two '
                           'pages a view), cut by tools/willem-sheet.py over tools/doran-sheet.py; SW W NW mirrored; willemglass_p1 (the mannequin render) kept beside it')})


def mounted():
    name = 'willemmounted_p1'
    win = windows(MOUNT, [('ride', 6), ('halt', 1)], False)
    hg = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'horsegrey_p1.json'), encoding='utf-8'))
    him = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', 'horsegrey_p1.png')).convert('RGBA'))
    ia = hg['anims']['idle']; cell = him[ia['y'] + 6 * ia['fh']:ia['y'] + 7 * ia['fh'], :ia['fw']]   # (its idle E, frame 1)
    xs = np.where((cell[..., 3] > 0).any(0))[0]; horse_len = xs[-1] - xs[0]
    pages, crops = {}, {}
    for (row, i, view), (fn, (x0, y0, x1, y1), _, floor) in win.items():
        if fn not in pages:
            pg = np.asarray(Image.open(os.path.join(_W, fn)).convert('RGB')).astype(np.float32); pages[fn] = (pg, DS.letters(pg, (), TOL))
        pg, lt = pages[fn]; x0, y0, x1, y1 = max(0, x0), max(0, y0), min(pg.shape[1], x1), min(pg.shape[0], y1)
        a = pg[y0:y1, x0:x1]; m = DS.figure(a, False, lt[y0:y1, x0:x1], False, TOL); ys, xs_ = np.where(m)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs_.min(), xs_.max() + 1))
        crops[(row, i, view)] = (a[sl], m[sl], floor - (y0 + sl[0].stop))
    kE = horse_len / float(crops[('halt', 0, 'E')][1].shape[1]); halt_h = crops[('halt', 0, 'E')][1].shape[0] * kE
    cells = {}
    for (row, i, view), (rgb, m, above) in crops.items():
        k = kE if view == 'E' else halt_h / float(crops[('halt', 0, view)][1].shape[0])
        o = DS.to1x(rgb, m, k, ['red', 'fire'])
        cells[(DS.FACE[view], row, i)] = (o, int(round(above * k)))
    for mf, sf in DS.MIRROR.items():
        for (f, row, i) in [c for c in list(cells) if c[0] == sf]:
            o, l = cells[(f, row, i)]; cells[(mf, row, i)] = (np.ascontiguousarray(o[:, ::-1]), l)
    allo = [o for o, _ in cells.values()]
    FW = int(2 * np.ceil(max(o.shape[1] for o in allo) / 2 + 2)); lift = max(l for _, l in cells.values())
    FH = int(max(o.shape[0] for o in allo) + lift + 6); AX, AY = FW // 2, FH - 4
    rows = [('idle', [('halt', 0)], 2), ('walk', [('ride', j) for j in range(6)], 12)]
    sheet = np.zeros((8 * FH * len(rows), FW * 6, 4), np.uint8); anims = {}; y = 0
    for rname, keys, fps in rows:
        for f in range(8):
            for i, (row, j) in enumerate(keys):
                o, l = cells[(f, row, j)]; h, w = o.shape[:2]
                dx = AX - w // 2; dy = AY - (h - 1) - l
                dst = sheet[y + f * FH + dy:y + f * FH + dy + h, i * FW + dx:i * FW + dx + w]; dst[o[..., 3] > 0] = o[o[..., 3] > 0]
        anims[rname] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=len(keys), fps=fps); y += 8 * FH
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', name + '.png'), optimize=True)
    meta = dict(image='art/%s.png' % name, fw=FW, fh=FH, ax=AX, ay=AY, top=int(round(halt_h)), anims=anims, name='Willem on the grey',
                hold=['ride: the far hooves overlap and the gait\'s leg order wants native playback; NE gained small gold waist buttons (the art desk\'s own notes)'],
                source='drawn by the art desk (HALFWAY-INN-WILLEM-MOUNTED, 11-05: art-wanted section 35 block 8, horse and rider together), cut by tools/willem-sheet.py '
                       'at horsegrey_p1\'s length; idle the Halt, walk the six-frame Ride; SW W NW mirrored; not wired yet (nothing draws a mounted unit)')
    with open(os.path.join(ROOT, 'deep16', 'art', name + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, cell %dx%d, horse %d px long, halt %d px tall' % (name, sheet.shape[1], sheet.shape[0], FW, FH, horse_len, round(halt_h)))
    if 'check' in sys.argv:
        out = os.path.join(ROOT, 'deep16', 'art-src', 'willem'); os.makedirs(out, exist_ok=True)
        Z = 2; rv = Image.new('RGBA', (FW * 8 * Z, FH * 8 * Z), (40, 50, 70, 255)); hgc = Image.fromarray(cell, 'RGBA')
        for jv, f in enumerate([0, 7, 6, 5, 4, 1, 2, 3]):
            for i in range(7):
                yy = 0 if i == 6 else 8 * FH; xx = 0 if i == 6 else i
                src = sheet[yy + f * FH:yy + (f + 1) * FH, xx * FW:(xx + 1) * FW]
                rv.alpha_composite(Image.fromarray(np.ascontiguousarray(src), 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST), (i * FW * Z, jv * FH * Z))
        rv.alpha_composite(hgc.resize((hgc.width * Z, hgc.height * Z), Image.NEAREST), (7 * FW * Z, 2 * FH * Z))   # (horsegrey_p1's idle E beside, for the size)
        rv.save(os.path.join(out, name + '-review.png'), optimize=True); print('review:', os.path.join(out, name + '-review.png'))


if __name__ == '__main__':
    want = [a for a in sys.argv[1:] if a in ('willemglass_p2', 'willemmounted_p1')] or ['willemglass_p2', 'willemmounted_p1']
    if 'willemglass_p2' in want:
        DS.cut(fight_spec(), 'willemglass_p2')
    if 'willemmounted_p1' in want:
        mounted()
