"""DEEP16 pipeline 2 (generated art): Amara's fight figure -> amara_p2, her fight sheet in all eight facings.

    python tools/amara-sheet.py            (writes deep16/art/amara_p2.png/.json)
    python tools/amara-sheet.py check      (also deep16/art-src/amara/amara_p2-review.png: every row of every view at 3x)

Asked in art-wanted section 35 (11-04, the Inn seat; Griz 10-30: "we'll need pose requests to replace willem and amara in combat as well as inn NPCs").
The art desk's HALFWAY-INN-AMARA-COMBAT, sorted to deep16/_src/amara/INN-COMBAT-1104/: one page a view, HEAD 7 SE, 8 NE (from behind), 9 S, 10 E, 11 N;
seven labelled bands a page, each read from the left: Idle 6, Walk 8, Run 8, Cast 6, Flinch 4, Fall 4, Prone 1 (its CUTTER-NOTES.md). The old
amara_p1 (a 3D render) is kept beside it.

Rows (the engine's names): idle, walk, run, cast (her Eldritch Blast plays it: js/battle.js; the arm out on 4, `release` 3), flinch, hurt <- Fall 4,
prone <- Fall 2-4 then Prone 1 (where she lies, js/sprites.js S.proneRow). Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.

How a page is cut: the navy by the page's edges (tools/barley-slash-sheet.py's way); the labels are the pieces left of the first frame; the bands
are the page's runs of figure rows; a band's frames are its pieces joined where they overlap across. One scale a page: her Idle's median height
to TALL. A standing frame on its lowest row, by its torso's middle; the Run keeps its lift -- each frame stands on its band's floor, not its own
(the art desk's "Preserve suspension on Run"); a frame on the ground on its whole body's middle. Boxed down, snapped to the 64 (red and fire left out: her skin flecked them), outlined.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
SRC = os.path.join(pix.SRC, 'amara', 'INN-COMBAT-1104')
NAME = 'amara_p2'
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
OUTL = np.array([int(P['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)

TALL = 48                                            # sole to crown (the inn's women: folkwoman_p1 47; the art desk's 46-49)
FH, AY = 64, 60
PAGES = {0: 'AMARA-HEAD-09-S.png', 7: 'AMARA-HEAD-07-SE.png', 6: 'AMARA-HEAD-10-E.png', 5: 'AMARA-HEAD-08-NE.png', 4: 'AMARA-HEAD-11-N.png'}
MIRROR = {1: 7, 2: 6, 3: 5}
BANDS = [('Idle', 6), ('Walk', 8), ('Run', 8), ('Cast', 6), ('Flinch', 4), ('Fall', 4), ('Prone', 1)]
GROUND = {('Fall', 2), ('Fall', 3), ('Prone', 0)}
ROWS = [('idle', 6, [('Idle', i) for i in range(6)]), ('walk', 10, [('Walk', i) for i in range(8)]), ('run', 12, [('Run', i) for i in range(8)]),
        ('cast', 10, [('Cast', i) for i in range(6)]), ('flinch', 12, [('Flinch', i) for i in range(4)]), ('hurt', 10, [('Fall', i) for i in range(4)]),
        ('prone', 10, [('Fall', 1), ('Fall', 2), ('Fall', 3), ('Prone', 0)])]
RELEASE = {'cast': 3}
BG_TOL, HOLE = 30, 400
AVOID = ['red', 'fire']                      # (her brown skin flecked the reds on cheeks and knuckles at the first cut: left out, as Dace's)


def page_frames(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H, W = a.shape[:2]
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < BG_TOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, n + 1))
    fg = ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > HOLE]))
    flab, fn = ndimage.label(fg)
    boxes = ndimage.find_objects(flab)
    # the labels: light text in the left column, before the first frame
    x_first = min(b[1].start for b in boxes if b and (b[0].stop - b[0].start) > H * 0.06)
    keep = [i + 1 for i, b in enumerate(boxes) if b and b[1].stop > x_first + 4 and (b[0].stop - b[0].start) * (b[1].stop - b[1].start) > 30]
    fig = np.isin(flab, keep)
    rows = fig.any(1); runs = []
    y = 0
    while y < H:
        if rows[y]:
            y0 = y
            while y < H and rows[y]: y += 1
            runs.append([y0, y])
        y += 1
    while len(runs) > len(BANDS):                    # (a band split by a gap inside it: join the nearest pair)
        g = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]; i = int(np.argmin(g)); runs[i:i + 2] = [[runs[i][0], runs[i + 1][1]]]
    if len(runs) != len(BANDS):
        raise SystemExit('%s: %d bands, not %d' % (os.path.basename(path), len(runs), len(BANDS)))
    out = {}
    for (name, cnt), (y0, y1) in zip(BANDS, runs):
        band = fig[y0:y1]
        cols = band.any(0); segs = []; x = 0
        while x < W:
            if cols[x]:
                x0 = x
                while x < W and cols[x]: x += 1
                segs.append([x0, x])
            x += 1
        segs = [s for s in segs if s[1] - s[0] > 6]
        merged = []
        for s in segs:                               # (a hand or a coat-tail parted from its body by a few px)
            if merged and s[0] - merged[-1][1] < 10: merged[-1][1] = s[1]
            else: merged.append(list(s))
        if len(merged) < cnt:
            raise SystemExit('%s %s: %d frames, not %d' % (os.path.basename(path), name, len(merged), cnt))
        for i, (x0, x1) in enumerate(merged[:cnt]):
            m = band[:, x0:x1]; ys, xs = np.where(m)
            sl = (slice(y0 + ys.min(), y0 + ys.max() + 1), slice(x0 + xs.min(), x0 + xs.max() + 1))
            out[(name, i)] = dict(rgb=a[sl].astype(np.uint8), mask=fig[sl], y0=sl[0].start, x0=sl[1].start, floor=y1)
    return out


def to1x(fr, k):
    h, w = fr['mask'].shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((fr['mask'] * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = fr['rgb'].astype(np.float32) * fr['mask'][..., None]
    rgb = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for c in range(3)], -1)
    rgb = rgb / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(rgb, AVOID)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def cut():
    cells = {}                                       # (facing, key) -> (rgba at 1x, its x anchor in it, its foot row in it)
    for f, fn in PAGES.items():
        fr = page_frames(os.path.join(SRC, fn))
        k = TALL / float(np.median([fr[('Idle', i)]['mask'].shape[0] for i in range(6)]))
        for key, d in fr.items():
            o = to1x(d, k); al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
            if key in GROUND:
                cx = ndimage.center_of_mass(al)[1]
            else:
                top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
                cx = ndimage.center_of_mass(top)[1]
            foot = ys[-1]
            if key[0] == 'Run':                       # (the lift kept: the band's floor, not the frame's own lowest row)
                foot = ys[-1] + round((d['floor'] - (d['y0'] + d['mask'].shape[0])) * k)
            cells[(f, key)] = (o, cx, foot)
    for m, src in MIRROR.items():
        for key in [k_ for (f_, k_) in list(cells) if f_ == src]:
            o, cx, foot = cells[(src, key)]
            cells[(m, key)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    # each row its own cell width: the widest frame's reach either side of the anchor, all facings
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        reach = max(max(cx, cells[(f, key)][0].shape[1] - cx) for f in range(8) for key in keys for (o, cx, foot) in [cells[(f, key)]])
        fw = int(2 * np.ceil(reach + 2)); ax = fw // 2
        blk = np.zeros((8 * FH, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for i, key in enumerate(keys):
                o, cx, foot = cells[(f, key)]
                dx, dy = int(round(ax - cx)), AY - foot
                h, w = o.shape[:2]
                cy0, cx0 = f * FH + max(0, dy), i * fw + max(0, dx)
                sy, sx = max(0, -dy), max(0, -dx)
                hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, fw - max(0, dx))
                sub = o[sy:sy + hh, sx:sx + ww]; dst = blk[cy0:cy0 + hh, cx0:cx0 + ww]
                put = sub[..., 3] > 0; dst[put] = sub[put]
        a = dict(y=y, fw=fw, fh=FH, ax=ax, ay=AY, frames=len(keys), fps=fps)
        if name in RELEASE: a['release'] = RELEASE[name]
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=FH, ax=i0['ax'], ay=AY, top=TALL, anims=anims,
                name='Amara', hold=['SE cast: frame 3 lifts the near arm, 4-5 the far arm (the art desk\'s own review note)',
                                    'N walk and run: the same boot leads in several frames (the art desk\'s own note)'],
                source='drawn by the art desk (HALFWAY-INN-AMARA-COMBAT, 11-04: art-wanted section 35, her fight figure in five views, seven rows a view), '
                       'cut by tools/amara-sheet.py; SW W NW mirrored; amara_p1 (the old render) kept beside it')
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s' % (NAME, W, y, ', '.join('%s %d@%dpx' % (n, a['frames'], a['fw']) for n, a in anims.items())))
    if 'check' in sys.argv:
        Z = 3; out = os.path.join(ROOT, 'deep16', 'art-src', 'amara'); os.makedirs(out, exist_ok=True)
        rv = Image.new('RGBA', (W * Z, y // 8 * 5 * Z), (12, 20, 40, 255)); yy = 0
        for name, fps, keys in ROWS:
            a = anims[name]
            for j, f in enumerate([0, 7, 6, 5, 4]):
                crop = sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * a['frames']]
                rv.alpha_composite(Image.fromarray(crop, 'RGBA').resize((crop.shape[1] * Z, FH * Z), Image.NEAREST), (0, yy)); yy += FH * Z
        rv.save(os.path.join(out, NAME + '-review.png'), optimize=True)
        print('review:', os.path.join(out, NAME + '-review.png'))


cut()
