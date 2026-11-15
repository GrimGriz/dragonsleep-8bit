"""DEEP16 pipeline 2 (generated art): the wyvern, the SRD's Large dragon, the Coldridge route's flier with the sting -> deep16/art/wyvern_p1, all eight facings.

    python tools/wyvern-sheet.py            (writes deep16/art/wyvern_p1.png/.json)
    python tools/wyvern-sheet.py check      (also deep16/art-src/wyvern/wyvern_p1-review.png: every row of every facing at 3x)

Asked in art-wanted section 45 (ART-132, 11-11, the Coldridge route's random encounters -- Griz: "Dragon is off the table for the way dragons are special
here, swap in wyvern and add owl bear"); the SE identity and Idle reviewed 11-14 (deep16/_src/art-desk/sent/ENGINE-RETURN-2026-11-14-wyvern-se-idle-REVIEW.md:
"GO"); cut 11-15 by the cutter-fresh-1115 seat on Griz's "Please start cutting Fresh one at a time". The art desk's ART-132-WYVERN-SOURCE-SHEETS, sorted out
of Fresh to deep16/_src/wyvern/2026-11-14-ART-132-SOURCE-SHEETS/ (the zip beside it; the 11-14 review zip, its pages byte-twins of these, in wyvern/superseded/):
a page a view and action -- HEAD 1 SE (its PAGE 1 the identity plate, not cut), 2 the rear NE, 3 S, 4 E, 5 N -- Idle 6, Walk 8, Fly 6, Bite 6, Sting 6,
Claws 6, Flinch 4, Fall 6, Prone 2; 250 drawings, none missing, every page's SHA-256 as its FRAME-MAP.json says. Each drawing's window here is the map's
keyed box padded PAD a side; cut by tools/doran-sheet.py's figure (the navy flooded from the window's edges, the body and what is near it; a small bright
piece under the feet -- a printed number -- dropped), boxed down, snapped to the 64 (no red: the browns), outlined.

Not the art desk's 1x previews: they set each row's scale so its median height matched the Idle's, which grows the hunched Walk by about a fifth and the
airborne rows by a quarter. Here ONE scale for every view (the art desk drew each view's Idle at the same size, 293 to 306 px): the SE Idle to TALL, the
manticore's standing height (the frame it shares: manticore_p1, 160 x 102, the ground at 90). Pages drawn at another size are brought to it by FRAME-MAP's
boxes, a view each (fits() below): Bite and Flinch by their standing frames (Bite 1; Flinch 1 and 4) against the Idle, width and height averaged; Fall
by Fall 1's height (NE's tail is out already); Sting by Sting 1's width (its tail moves the height); the Walk by its median width in the side views SE NE E (the hunch moves the height) and by
width and height averaged in S and N (front and back, the hunch hardly shows); Fly and Claws (the same 6-frame pages, no standing frame) at the mean of the
view's Bite and Sting fits; Prone by Prone 1's width to Fall 6's (on its side both).

Where each drawing stands: a standing frame by its FEET -- the middle of its lowest 12% (the wing-claws and the hind talons, the art desk's "register by the
wing wrists and hind toes"), its lowest row on the ground line -- so a Bite's lunge or a Sting's arc does not slide the feet; a lying one (Fall 4-6, Prone)
by its whole body's middle; an airborne one (Fly, Claws) by its box's middle, each frame as far above its band's lowest drawing as on the page and the band's
lowest at the ground line: the grid lifts a flier aloft itself (js/ui.js UI.aloftRow, as tools/griffon-sheet.py's LIFT). Facings (RULED 10-14): S SE E NE N as
drawn, SW W NW their mirrors.

Rows: idle 6; walk 8; fly 6 (in place of idle and walk while it is aloft); attack 6 (the Bite -- js/battle.js plays `attack` where the sheet has no `bite`;
`release` 2: frame 3 the bite); sting 6 (the Stinger's own row, its `row`; `release` 3: frame 4 the sting); rake 6 (the Claws, aloft only -- deep16/data/foes.js
wyvern `aloftMulti`; `release` 2: frame 3 the rake); flinch 4; hurt 6 (Fall, held on 6: on its side, a wing crumpled); prone 3 (Fall 5, 6, then Prone 1 --
js/sprites.js S.proneRow); getup 2 (Prone 1, 2: heaving itself up).

Aloft (11-15, Griz at the parade: "see if the wyvern cutter needs attacks while in flight and if it can cut off the legs on the attacks and use those"; then, to the
lanes desk, "1 - yeah"): airattack 6 and airsting 6 -- the Bite's and the Sting's frames with the legs cut off, everything CUT px and less over the ground line
taken away (but a piece below the cut that carries the stinger's green -- its tip as it strikes low -- is kept), the cut's edge outlined; each frame where the ground row has it, so the body does not jump. js/battle.js plays `air` + the blow's row while the wyvern is aloft (G.aloft) and
the sheet has one. The Claws (`rake`) stay as drawn: the art desk drew them in the air, wings spread and the talons forward -- the talons ARE the blow, aloft only.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
pix = DS.pix

FOLDER = os.path.join(pix.SRC, 'wyvern', '2026-11-14-ART-132-SOURCE-SHEETS')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'wyvern', os.path.basename(FOLDER))
NAME = 'wyvern_p1'
FH, AY = 102, 90                # (the manticore's cell: manticore_p1, 102 tall, the ground at 90 -- the art desk drew the wyvern on its frame)
TALL = 60                       # (the SE idle, the lowest talon to the horns' tips: the manticore's 59 to 61, the art desk's own 60)
PAD = 8
FEET = 0.12                     # (a standing frame's feet: its lowest 12% of rows)
AVOID = ['red', 'skin']         # (slate, mountain brown, a pale belly, a green stinger, amber eyes: no red; and no skin -- the warmer pages' browns (SE and NE Walk, NE Idle) snapped orange to it, 13 to 20% of a facing against 2 to 4%)
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
COUNT = {'idle': 6, 'walk': 8, 'fly': 6, 'attack': 6, 'sting': 6, 'rake': 6, 'flinch': 4, 'hurt': 6, 'prone': 2}
AIR = ('fly', 'rake')
LEGLESS = {'airattack': 'attack', 'airsting': 'sting'}     # (aloft: the ground blow's frames with the legs cut off -- legless() below)
CUT = 14                        # (px over the ground line: the hind legs and the folded wings' wrists stand below it, the belly above, in every view at the one scale)
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0), ('prone', 1)}
ROWS = [('idle', 6, [('idle', i) for i in range(6)]), ('walk', 8, [('walk', i) for i in range(8)]), ('fly', 10, [('fly', i) for i in range(6)]),
        ('attack', 10, [('attack', i) for i in range(6)]), ('sting', 10, [('sting', i) for i in range(6)]), ('rake', 10, [('rake', i) for i in range(6)]),
        ('airattack', 10, [('attack', i) for i in range(6)]), ('airsting', 10, [('sting', i) for i in range(6)]),
        ('flinch', 12, [('flinch', i) for i in range(4)]), ('hurt', 8, [('hurt', i) for i in range(6)]),
        ('prone', 8, [('hurt', 4), ('hurt', 5), ('prone', 0)]), ('getup', 6, [('prone', 0), ('prone', 1)])]
RELEASE = {'attack': 2, 'sting': 3, 'rake': 2, 'airattack': 2, 'airsting': 3}                          # (the art desk's contacts: Bite 3, Sting 4, Claws 3 -- zero-based)
HOLD = ['NE walk: frames 3 and 7 lift different hind feet, and 1 and 5 favour the same wing wrist -- the wing-brace cycle wants another look (the art desk\'s own note)',
        'NE fall starts with the tail out past the idle\'s; NE flinch\'s wing half-opens subtly; N claws: the rear view foreshortens the rake (the art desk\'s own notes)',
        'the head reads more dragon than the ask\'s "narrow horned head" (swept horns, a spiny crest): Griz\'s eye (the 11-14 review\'s one open point)']
SOURCE = ('drawn by the art desk (ART-132-WYVERN-SOURCE-SHEETS, 11-14: art-wanted section 45), cut by tools/wyvern-sheet.py; SW W NW mirrored -- '
          'the SRD 5.1 Wyvern: deep16/data/foes.js wyvern')

FM = json.load(open(os.path.join(FOLDER, 'FRAME-MAP.json'), encoding='utf-8')) if os.path.isdir(FOLDER) else {'rows': []}
MAP = {(r['cutter_key'], r['facing']): r for r in FM['rows']}


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def box(act, v, i):
    return MAP[(act, v)]['frames'][i]['keyed_bounds_xyxy']


def dims(act, v, i):
    x0, y0, x1, y1 = box(act, v, i); return (x1 - x0, y1 - y0)


def fits():
    """{(act, view): k} -- each row's scale against its view's Idle (times ONE: the SE Idle's scale everywhere)"""
    F = {}
    for v in VIEWS:
        iw, ih = med([dims('idle', v, i)[0] for i in range(6)]), med([dims('idle', v, i)[1] for i in range(6)])
        avg = lambda idx, a: 0.5 * (iw / med([dims(a, v, i)[0] for i in idx]) + ih / med([dims(a, v, i)[1] for i in idx]))
        F[('idle', v)] = 1.0
        F[('attack', v)] = avg([0], 'attack')
        F[('sting', v)] = iw / float(dims('sting', v, 0)[0])
        F[('flinch', v)] = avg([0, 3], 'flinch')
        F[('hurt', v)] = ih / float(dims('hurt', v, 0)[1])                 # (Fall 1 by its height: NE's tail is already out past the idle's, the art desk's note)
        F[('walk', v)] = iw / med([dims('walk', v, i)[0] for i in range(8)]) if v in ('SE', 'NE', 'E') else avg(range(8), 'walk')
        F[('fly', v)] = F[('rake', v)] = 0.5 * (F[('attack', v)] + F[('sting', v)])
        F[('prone', v)] = F[('hurt', v)] * dims('hurt', v, 5)[0] / float(dims('prone', v, 0)[0])
    return F


_PAGES = {}


def crop(act, v, i):
    """-> (rgb, mask, above): the drawing in its window, tight; `above` how far its lowest row stands over its printed band's lowest (source px)"""
    r = MAP[(act, v)]
    fn = os.path.join(FOLDER, *r['source'].split('/'))
    if fn not in _PAGES:
        _PAGES[fn] = np.asarray(Image.open(fn).convert('RGB')).astype(np.float32)
    pg = _PAGES[fn]
    x0, y0, x1, y1 = box(act, v, i)
    X0, Y0, X1, Y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(pg.shape[1], x1 + PAD), min(pg.shape[0], y1 + PAD)
    a = pg[Y0:Y1, X0:X1]
    m = DS.figure(a, below=True)
    ys, xs = np.where(m)
    sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    n = len(r['frames']); per = n // 2 if n >= 6 else n                    # (printed two bands of half the row each; a 4- or 2-frame page one band)
    band = [j for j in range(n) if j // per == i // per]
    floor = max(box(act, v, j)[3] for j in band)
    return a[sl], m[sl], floor - (Y0 + sl[0].stop)


def legless(c):
    """one placed frame's cell, in place: the legs off -- every piece below the cut goes but the stinger's (its green), the cut's edge outlined"""
    al = c[..., 3] > 0
    below = al.copy(); below[:AY - CUT + 1] = False
    ol = (c[..., :3] == np.array(DS.OUTL, np.uint8)).all(-1)
    lab, n = ndimage.label(below & ~ol)                                    # (pieces by their colour, the outline between them not joining them: the stinger's tip touches a foot as it strikes)
    keep = np.zeros_like(al)
    for k in range(1, n + 1):
        px = c[lab == k].astype(int)
        if ((px[:, 1] > px[:, 0] + 8) & (px[:, 1] > px[:, 2] + 8)).any():   # (green in it: the stinger; a leg, a foot or a wing's wrist has none)
            keep |= lab == k
    keep |= below & ol & ndimage.binary_dilation(keep, np.ones((3, 3), bool))  # (and its own outline)
    c[below & ~keep] = 0
    now = c[..., 3] > 0
    edge = np.zeros_like(al); edge[:-1] = now[:-1] & ~now[1:] & al[1:]
    c[edge, :3] = DS.OUTL; c[edge, 3] = 255


def cut(check=False):
    F = fits()
    base = None
    cells = {}
    for name, fps, keys in ROWS:
        for (act, i) in keys:
            for v in VIEWS:
                if (DS.FACE[v], act, i) in cells:
                    continue
                rgb, m, above = crop(act, v, i)
                if base is None:
                    base = TALL / float(med([crop('idle', 'SE', j)[1].shape[0] for j in range(6)]))
                k = base * F[(act, v)]                                    # (ONE scale: every view's Idle at the SE Idle's, each row fitted to its view's Idle)
                o = DS.to1x(rgb, m, k, AVOID)
                al = o[..., 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]
                if act in AIR:
                    cx = 0.5 * (xs[0] + xs[-1])
                    foot = ys[-1] + int(round(above * k))
                elif (act, i) in LYING:
                    cx = ndimage.center_of_mass(al)[1]; foot = ys[-1]
                else:
                    ft = al.copy(); ft[:ys[-1] - max(2, int(round((ys[-1] - ys[0]) * FEET)))] = False
                    cx = ndimage.center_of_mass(ft)[1]; foot = ys[-1]
                cells[(DS.FACE[v], act, i)] = (o, cx, foot)
    for mf, sf in DS.MIRROR.items():
        for (f, act, i) in [c for c in list(cells) if c[0] == sf]:
            o, cx, foot = cells[(f, act, i)]
            cells[(mf, act, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        reach = max(max(cx, o.shape[1] - cx) for f in range(8) for k_ in keys for (o, cx, foot) in [cells[(f,) + tuple(k_)]])
        fw = int(2 * np.ceil(reach + 2)); ax = fw // 2
        blk = np.zeros((8 * FH, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k_ in enumerate(keys):
                o, cx, foot = cells[(f,) + tuple(k_)]
                dx, dy = int(round(ax - cx)), AY - foot
                h, w = o.shape[:2]
                assert dy >= 0 and dy + h <= FH and dx >= 0 and dx + w <= fw, (name, f, k_, 'a frame past its cell', dx, dy, w, h)
                dst = blk[f * FH + dy:f * FH + dy + h, j * fw + dx:j * fw + dx + w]
                put = o[..., 3] > 0; dst[put] = o[put]
                if name in LEGLESS:
                    legless(blk[f * FH:(f + 1) * FH, j * fw:(j + 1) * fw])
        a = dict(y=y, fw=fw, fh=FH, ax=ax, ay=AY, frames=len(keys), fps=fps)
        if name in RELEASE:
            a['release'] = RELEASE[name]
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks)
    sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=FH, ax=i0['ax'], ay=AY, top=TALL, anims=anims, name='Wyvern', hold=HOLD, source=SOURCE)
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s' % (NAME, W, y, ', '.join('%s %d@%dpx' % (n_, a_['frames'], a_['fw']) for n_, a_ in anims.items())))
    print('  base %.4f; fits %s' % (base, ', '.join('%s %s %.3f' % (a_, v, F[(a_, v)]) for (a_, v) in sorted(F) if a_ != 'idle')))
    if check:
        Z = 3; out = os.path.join(ROOT, 'deep16', 'art-src', 'wyvern'); os.makedirs(out, exist_ok=True)
        tiles = []
        for name, fps, keys in ROWS:
            a = anims[name]
            for f in [0, 7, 6, 5, 4, 1, 2, 3]:
                tiles.append(sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * a['frames']])
        rv = Image.new('RGBA', (W * Z, len(tiles) * FH * Z), (12, 20, 40, 255))
        for j, t in enumerate(tiles):
            rv.alpha_composite(Image.fromarray(t, 'RGBA').resize((t.shape[1] * Z, FH * Z), Image.NEAREST), (0, j * FH * Z))
        rv.save(os.path.join(out, NAME + '-review.png'), optimize=True)
        print('review:', os.path.join(out, NAME + '-review.png'))
    return sheet, anims


if __name__ == '__main__':
    cut('check' in sys.argv)
