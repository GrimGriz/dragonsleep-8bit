"""DEEP16 pipeline 2 (generated art): Vivian Venn's fight figures as the art desk draws them, beside the LPC composite she walks as (vivian_p0).

    python tools/vivian-sheet.py [vivian_p2|vivian_p3]          (writes deep16/art/<name>.png/.json; both with no name)
    python tools/vivian-sheet.py [name] check                   (also deep16/art-src/vivian/<name>-review.png: every row of every drawn view at 3x)

Each look is the art desk's ART-MC-VIVIAN-COMBAT redrawing vivian_p0 row for row (its notes: "Retain runtime key vivian_p0 and its existing row
semantics"), two batches a look, sorted to deep16/_src/vivian/ by _src/art-desk/heroes-1105-sort.py and heroes-1105b-sort.py:
  vivian_p2  her art-wanted section 37 identity (HEAD 1: the teal jacket open over the leather, the candle-knife), 11-04:
             COMBAT-A-1104, its "SE checkpoint" -- SE only: Idle 2, Walk 9 (its own HOLD: the lead boot repeats), Attack 6 (frame 4, the contact,
             from SE-CONTACT-SOURCE.png so the blade stays in the sequence); COMBAT-B-1104 -- Hurt 6 and Sit 3 in all five views.
  vivian_p3  "3B": the hood up, a slate-teal cloak over dark studded leather (the loose page "Vivian Venn -- Studded Leather: Open and Hooded", 3B), 11-05:
             3B-COMBAT-A-1105 -- Idle 2, Walk 9 and Attack 6 in all five views (its notes: the walk's contacts still candidates, the lead boot repeating
             in SE and S); 3B-COMBAT-B-1105 -- Hurt 6 and Sit 3 in all five.
Each drawing is read from its FRAME-MAP.csv window (the windows hold matte and no labels; both column spellings read): the navy by the window's edges,
the figure what is not navy or a navy hole bigger than HOLE.

Rows (vivian_p0's names): idle, walk, attack, hurt, sit; a row drawn in SE only carries `drawn` [SE, SW] and js/sprites.js shows the nearest. Facings
(RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors. Scale, one a page: a page with an idle by its idle's median height to TALL (vivian_p0's top,
49 -- the notes' "top metadata 49"); a page of hurt and sit (drawn bigger: the head 1.16 x on vivian_p2's SE) by its Stagger to STAG, a stagger as tall
as her idle. A frame stands on its lowest row (AY, vivian_p0's 61); upright, by its torso's middle (the top 55%); down (hurt 5 and 6, the notes'
"register their pelvis to the same world position"), by its whole body's middle. Boxed down, snapped to the 64, outlined -- her auburn hair on the reds.
NOT WIRED: SV.LOOK keeps vivian_p0; which look she fights in is his word.
"""
import csv, importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
SRC = os.path.join(pix.SRC, 'vivian')
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
OUTL = np.array([int(P['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)

TALL, STAG = 49, 50
FH, AY = 64, 61
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ROWS = [('idle', 6, 2), ('walk', 10, 9), ('attack', 12, 6), ('hurt', 10, 6), ('sit', 2, 3)]   # (name, fps, frames: vivian_p0's)
GROUND = {('hurt', 4), ('hurt', 5)}
BG_TOL, HOLE = 30, 400
AVOID = None
LOOKS = {
    'vivian_p2': dict(batches=('COMBAT-A-1104', 'COMBAT-B-1104'), name='Vivian',
                      hold=['idle, walk and attack drawn in SE only so far (the art desk\'s batch A, its SE checkpoint): the other views wait on its verdict',
                            'SE walk: the lead boot repeats at the opposite contact (the art desk\'s own HOLD)'],
                      source='drawn by the art desk (ART-MC-VIVIAN-COMBAT batches A and B, 11-04: her art-wanted section 37 identity), cut by tools/vivian-sheet.py; '
                             'SW W NW mirrored; not wired -- vivian_p0 (the LPC composite) is still her figure'),
    'vivian_p3': dict(batches=('3B-COMBAT-A-1105', '3B-COMBAT-B-1105'), name='Vivian',
                      hold=['walk: the contacts are the art desk\'s candidates, the lead boot repeating in SE and S (its own note)',
                            'S and N attack: the blade sweeps across the screen at the contact; check it reads toward the target (its own note)',
                            'N and the back views: a studded panel at the lower back the outfit page does not show (its own note)'],
                      source='drawn by the art desk (VIVIAN-3B-COMBAT batches A and B, 11-05: the hood up, the slate-teal cloak over dark studded leather), '
                             'cut by tools/vivian-sheet.py; SW W NW mirrored; not wired -- vivian_p0 (the LPC composite) is still her figure'),
}


def col(r, *names):
    for n in names:
        if r.get(n) not in (None, ''):
            return r[n]
    raise KeyError(names)


def windows(look):
    """[(batch, view, row, frame index, file, box)] from the look's FRAME-MAP.csv files"""
    out = []
    for batch in LOOKS[look]['batches']:
        for r in csv.DictReader(open(os.path.join(SRC, batch, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
            box = tuple(int(col(r, *n)) for n in (('x0', 'left'), ('y0', 'top'), ('x1_exclusive', 'right_exclusive', 'x1'), ('y1_exclusive', 'bottom_exclusive', 'y1')))
            out.append((batch, r['view'], col(r, 'row', 'action'), int(col(r, 'runtime_index_0_based', 'runtime_index')), r['file'], box))
    return out


def figure(a):
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3), a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < BG_TOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, n + 1))
    fg = ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > HOLE]))
    fl, fn = ndimage.label(fg)
    sz = ndimage.sum(fg, fl, range(1, fn + 1))
    return np.isin(fl, [i + 1 for i, s in enumerate(sz) if s > 0.005 * sz.max()])     # (specks of the matte's dither out)


def to1x(rgb, mask, k):
    h, w = mask.shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb.astype(np.float32) * mask[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(c, AVOID)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def cut(look):
    L = LOOKS[look]
    pages, crops, pageof = {}, {}, {}
    for batch, view, row, i, fn, (x0, y0, x1, y1) in windows(look):
        if (batch, fn) not in pages:
            pages[(batch, fn)] = np.asarray(Image.open(os.path.join(SRC, batch, fn)).convert('RGB')).astype(np.float32)
        a = pages[(batch, fn)][y0:y1, x0:x1]
        m = figure(a); ys, xs = np.where(m)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        crops[(FACE[view], row, i)] = (a[sl], m[sl]); pageof[(FACE[view], row, i)] = (batch, fn)
    # one scale a page: by its idle to TALL, else by its stagger to STAG
    scale = {}
    for pg in set(pageof.values()):
        mine = [c for c, p in pageof.items() if p == pg]
        idle = [crops[c][1].shape[0] for c in mine if c[1] == 'idle']
        stag = [crops[c][1].shape[0] for c in mine if c[1] == 'hurt' and c[2] == 0]
        scale[pg] = TALL / float(np.median(idle)) if idle else STAG / float(stag[0]) if stag else None
    for pg in [p for p in scale if scale[p] is None]:   # (a page of one re-drawn frame -- vivian_p2's SE-CONTACT-SOURCE, attack 4: its batch's page of the same view)
        v = [c[0] for c, p in pageof.items() if p == pg][0]
        scale[pg] = [scale[p] for c, p in pageof.items() if p[0] == pg[0] and c[0] == v and scale.get(p)][0]
    cells = {}
    for c, (rgb, m) in crops.items():
        o = to1x(rgb, m, scale[pageof[c]])
        al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
        if (c[1], c[2]) in GROUND:
            cx = ndimage.center_of_mass(al)[1]
        else:
            top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
            cx = ndimage.center_of_mass(top)[1]
        cells[c] = (o, cx, ys[-1])
    for mf, src in MIRROR.items():
        for (f, row, i) in [c for c in list(cells) if c[0] == src]:
            o, cx, foot = cells[(f, row, i)]
            cells[(mf, row, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, n in ROWS:
        fs = [f for f in range(8) if (f, name, 0) in cells]
        reach = max(max(cx, o.shape[1] - cx) for f in fs for i in range(n) for (o, cx, foot) in [cells[(f, name, i)]])
        fw = int(2 * np.ceil(reach + 2)); ax = fw // 2
        blk = np.zeros((8 * FH, n * fw, 4), np.uint8)
        for f in fs:
            for i in range(n):
                o, cx, foot = cells[(f, name, i)]
                dx, dy = int(round(ax - cx)), AY - foot
                h, w = o.shape[:2]
                cy0, cx0 = f * FH + max(0, dy), i * fw + max(0, dx)
                sy, sx = max(0, -dy), max(0, -dx)
                hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, fw - max(0, dx))
                sub = o[sy:sy + hh, sx:sx + ww]; dst = blk[cy0:cy0 + hh, cx0:cx0 + ww]
                put = sub[..., 3] > 0; dst[put] = sub[put]
        a = dict(y=y, fw=fw, fh=FH, ax=ax, ay=AY, frames=n, fps=fps)
        if len(fs) < 8:
            a['drawn'] = fs                          # (SE and its mirror: js/sprites.js shows the nearest drawn facing)
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', look + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % look, fw=i0['fw'], fh=FH, ax=i0['ax'], ay=AY, top=TALL, anims=anims, name=L['name'], hold=L['hold'], source=L['source'])
    with open(os.path.join(ROOT, 'deep16', 'art', look + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s; scale %s' % (look, W, y, ', '.join('%s %d@%dpx%s' % (n_, a_['frames'], a_['fw'], ' drawn ' + str(a_['drawn']) if 'drawn' in a_ else '') for n_, a_ in anims.items()),
                                          ', '.join('%s %.4f' % (fn, k) for (b, fn), k in sorted(scale.items()))))
    if 'check' in sys.argv:
        Z = 3; out = os.path.join(ROOT, 'deep16', 'art-src', 'vivian'); os.makedirs(out, exist_ok=True)
        tiles = []
        for name, fps, n in ROWS:
            a = anims[name]
            for f in ([7] if 'drawn' in a else [0, 7, 6, 5, 4]):
                tiles.append(sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * a['frames']])
        rv = Image.new('RGBA', (W * Z, len(tiles) * FH * Z), (12, 20, 40, 255))
        for j, t in enumerate(tiles):
            rv.alpha_composite(Image.fromarray(t, 'RGBA').resize((t.shape[1] * Z, FH * Z), Image.NEAREST), (0, j * FH * Z))
        rv.save(os.path.join(out, look + '-review.png'), optimize=True)
        print('review:', os.path.join(out, look + '-review.png'))


for lk in [a for a in sys.argv[1:] if a in LOOKS] or list(LOOKS):
    cut(lk)
