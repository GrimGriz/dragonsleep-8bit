"""DEEP16 pipeline 2 (generated art): Griz's three GPT sheets of the ettin -> ettin_p2 (the Orc Skull stand-in, ettin_p1, stays on disk).

    python tools/ettin-sheet.py            (writes deep16/art/ettin_p2.png/.json)
    python tools/ettin-sheet.py check      (also the cut overlays, dev/visions/ettin/cut-<n>.png, and a lineup beside the troll and a gnoll)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Fresh/Two-Headed Ettin Battle Sprite Sheet-1.png (the
side rows), Front-facing ettin sprite sheet-2.png (from the front) and Ettin back-view flinch sprite fix-13.png (from behind: his re-roll of the
whole sheet, which replaces Ettin Back Sprite Sheet-8.png, whose Flinch swapped the weapons -- -8 is not read) -- Griz, 2026-10-08, from the
pastes in deep16-art-in-hand.md, "The stand-ins' first sheets" (#### The ettin) and "The six's fronts and backs".

Sheet 1: a portrait (dropped as lettering) and a turnaround (front, right, back, left: cut for the scale only), then rows facing RIGHT,
labelled by number: idle 6, walk 8, battleaxe 6, morningstar 6, flinch 4, fall 6, prone 2. Sheets 2 (the front) and 3 (behind): idle 6,
walk 8, battleaxe 6, morningstar 6, flinch 4, no turnaround -- every row the side's frame count, so no frame is repeated or dropped.
Cut as drawn, a slip of the generator's kept: sheet 1's battleaxe 4 (the chop at its lowest) has a second axe in the star's hand.
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored (the axe and the star change hands with them, and the heads change
sides, as every mirrored sheet's do); S takes sheet 2's rows and N sheet 3's for idle, walk, battleaxe (and attack), morningstar and flinch;
the fall (`hurt`) and the prone play side-on from S and N too. Rows: `battleaxe` and `morningstar` are named for the attacks (battle.js plays a
row named for the attack's name; its Multiattack swings the axe, then the star), `attack` is the battleaxe (the fallback), `hurt` the fall,
`prone` the Prone row (lying on its side, pushing itself up on one arm) played pushing-up first, so it lies at its last frame and gets up by
playing it back (deep16/js/sprites.js S.proneRow, the hobgoblin's way).
Scale: one for the creature in every row and facing. The side idle stands HEIGHT px (the Orc Skull stand-in's side idle is 102-106 with its
outline, the troll's 98-104: Large, twice the hobgoblin's 43-51). Sheet 1 drew its turnaround at about twice its rows' size, so the turnaround
meets the side rows by its Front against the side idle, by area -- the side rows are three-quarter views, both heads and the chest showing,
not the Right's profile (the Right's area would stand the front a third taller than the side; the heads, eyed against each other, put the
rows at 0.5-0.57 of the turnaround, the Front's area 0.54); sheets 2 and 3 meet the turnaround by their idles against its Front and its Back,
by area. Sheets 2 and 3 drew their idles at the turnaround's size and their other rows smaller (the walk 0.8 of the idle by area, the swings
and the flinch 0.85-0.92), so each of their rows meets its own idle by the median area of its frames (FIT) -- on sheet 1, drawn at one size,
the standing rows' medians agree with its idle within 3%, which is what says the measure holds across poses; sheet 1 keeps one K.
Colour: TONE brings sheets 2 and 3 to sheet 1 per channel (the goose's and the bugbears' way: both came warmer).
Cut: the band of each row runs strip-middle to strip-middle; where a weapon raised high reaches over the line into the row above (sheet 1's
battleaxe 3, its axe head among the walk's feet; sheet 3's battleaxe 2, by the walk's numbers), REACH and SPLIT below keep it with its own frame.
"""
import os, sys, json, subprocess, tempfile
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

FILES = {1: os.path.join('Fresh', 'Two-Headed Ettin Battle Sprite Sheet-1.png'), 2: os.path.join('Fresh', 'Front-facing ettin sprite sheet-2.png'),
         3: os.path.join('Fresh', 'Ettin back-view flinch sprite fix-13.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the portrait, the row names; every row's number strip is added below), and its
# rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe -- an axe blade is as white as a number on these sheets)
SHEETS = {
  1: dict(text=[(0, 0, 420, 240), (0, 240, 150, 1024)],
          rows=[('turn', (430, 0, 1300, 205), (205, 226), TURN, [583, 790, 997, 1200]),
                ('idle', (0, 226, 1536, None), (343, 357), NUM(6), [200, 349, 500, 645, 797, 947]),
                ('walk', (0, None, 1536, None), (456, 472), NUM(8), [201, 374, 549, 713, 894, 1063, 1238, 1397]),
                ('battleaxe', (0, None, 1536, None), (573, 587), NUM(6), [201, 350, 500, 651, 799, 949]),
                ('morningstar', (0, None, 1536, None), (686, 702), NUM(6), [209, 374, 537, 691, 854, 996]),
                ('flinch', (0, None, 1536, None), (797, 811), NUM(4), [219, 351, 514, 652]),
                ('fall', (0, None, 1536, None), (905, 921), NUM(6), [208, 369, 512, 651, 823, 992]),
                ('prone', (0, None, 1536, None), (994, 1008), NUM(2), [210, 382])]),
  2: dict(text=[(0, 95, 120, 135), (0, 298, 110, 335), (0, 508, 150, 545), (0, 706, 170, 745), (0, 894, 110, 930)],
          rows=[('idle', (0, 0, 1536, None), (205, 222), NUM(6), [244, 471, 700, 927, 1150, 1380]),
                ('walk', (0, None, 1536, None), (405, 421), NUM(8), [204, 369, 538, 712, 900, 1069, 1243, 1414]),
                ('battleaxe', (0, None, 1536, None), (612, 628), NUM(6), [262, 483, 703, 925, 1150, 1375]),
                ('morningstar', (0, None, 1536, None), (810, 827), NUM(6), [262, 482, 695, 917, 1147, 1370]),
                ('flinch', (0, None, 1536, None), (998, 1014), NUM(4), [255, 495, 727, 958])]),
  3: dict(text=[(0, 100, 120, 138), (0, 300, 110, 336), (0, 505, 145, 540), (0, 690, 166, 724), (0, 880, 110, 914)],
          rows=[('idle', (0, 0, 1536, None), (203, 218), NUM(6), [240, 456, 667, 878, 1090, 1309]),
                ('walk', (0, None, 1536, None), (396, 411), NUM(8), [209, 373, 547, 702, 881, 1054, 1228, 1411]),
                ('battleaxe', (0, None, 1536, None), (600, 615), NUM(6), [246, 462, 675, 897, 1109, 1327]),
                ('morningstar', (0, None, 1536, None), (789, 805), NUM(6), [248, 462, 699, 923, 1150, 1361]),
                ('flinch', (0, None, 1536, None), (982, 997), NUM(4), [248, 487, 714, 945])]),
}
SPLIT = {(3, 'battleaxe'): 393}   # (sheet, row) -> the line between it and the row above, by hand: battleaxe 2's axe head rises to 398, past
                                  # the walk numbers' middle (402); the walk's feet end at 390 (the numbers between are lettering either way)
# a row whose raised weapon reaches into the row above over the line, among that row's feet (no straight line parts them): the row is cut
# alone with its band reaching up to y, on a copy of the sheet with the row above's frames (each a blob standing in that row's band) painted
# navy; and the rest of the sheet is cut with the reaching frame painted navy
REACH = {(1, 'battleaxe'): 444}   # battleaxe 3's axe head rises to 449, among walk 2's and 3's feet (which end at 453)
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)] -- a weapon swung wide lies
# nearer the next frame's number than its own, so its core would seed the neighbour
FIX = {1: {'morningstar': [((318, 590, 501, 690), '2'), ((645, 590, 798, 690), '4')],
           'fall': [((558, 818, 750, 916), '4'), ((755, 848, 929, 912), '5')]},   # (fall 5's star, dropped at its feet, is as near 6's number)
       3: {'battleaxe': [((576, 432, 811, 598), '3')], 'morningstar': [((330, 620, 566, 786), '2')]}}   # (morningstar 2's star, swung wide
                                                                                                        # to its left, lies by 1's number)
CUT = {}
TOUCH_OK = {}

# the engine's rows: (sheet 1's row) for the side; S and N as described in the head
FRONT = BACK = ('idle', 'walk', 'battleaxe', 'morningstar', 'flinch')   # sheet 2's rows for S, sheet 3's for N
ROWS = {'idle': 'idle', 'walk': 'walk', 'attack': 'battleaxe', 'battleaxe': 'battleaxe', 'morningstar': 'morningstar', 'flinch': 'flinch',
        'hurt': 'fall', 'prone': 'prone'}
NEW = ['battleaxe']   # this cutter's own row (named here, not in pixelate.py; `morningstar` is there already)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'battleaxe': 10, 'morningstar': 10, 'flinch': 8, 'hurt': 8, 'prone': 8}
# per channel, each later sheet's figure brought to sheet 1's: mean RGB against sheet 1's turnaround view of the same side (the front's idle,
# 108.8 71.2 48.7, to the turnaround's Front, 101.3 69.1 51.4; behind, 105.4 69.1 48.1, to its Back, 95.3 64.9 48.9 -- both came warmer), 10-08
TONE = {2: (0.932, 0.970, 1.055), 3: (0.904, 0.939, 1.016)}
FIT = (2, 3)          # the sheets whose rows meet their own idle by area (fits below)
HEIGHT = 98           # the side idle, standing px
FH, AY = 148, 136


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX if k >= 1 else Image.LANCZOS)
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the torso and the heads; the arms and the weapons are thinner), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled) and its height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def place(a, x_ref, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def bands(L):
    """each row's band: the middle of the strip above to the middle of its own (the first row's top as given, SPLIT where set)"""
    rows, prev = [], None
    for r in SHEETS[L]['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:                            # (the row above ends there too)
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def run(L, img, rows, only, over):
    """sheetrows over one copy of the sheet, the rows given"""
    s = SHEETS[L]
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    path = os.path.join(tempfile.gettempdir(), 'ettin-sheet-%d-%s.png' % (L, only[0] if only else 'all'))
    Image.fromarray(img).save(path)
    try:
        return SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), only=only,
                            overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig


def cut(L, check=False):
    rows = bands(L)
    img = np.asarray(Image.open(os.path.join(SRC, FILES[L])).convert('RGB')).copy()
    navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
    over = [] if check else None
    reach = [(r, y) for (l, r), y in REACH.items() if l == L]
    if not reach:
        out = run(L, img, rows, None, over)
    else:
        lab, n = ndimage.label(SR.figure_mask(img.astype(np.int32)), structure=np.ones((3, 3)))
        objs = ndimage.find_objects(lab)
        big = ndimage.sum(lab > 0, lab, range(1, n + 1)) >= 400                 # (a frame, not a number)
        home = {r[0]: r[1] for r in rows}
        rest, out = img.copy(), {}
        for row, y in reach:
            x0, y0, x1, y1 = home[row]
            mine = [i + 1 for i, sl in enumerate(objs) if big[i] and y0 <= sl[0].stop - 1 < y1 and sl[0].start < y0]       # its frames that reach up
            above = [i + 1 for i, sl in enumerate(objs) if sl[0].stop - 1 < y0 and sl[0].stop > y]           # the row above's, in its reach
            rest[np.isin(lab, mine)] = navy
            alone = img.copy(); alone[np.isin(lab, above)] = navy
            print('  sheet %d %s: %d frame(s) reach up to %d, cut alone' % (L, row, len(mine), min(objs[i - 1][0].start for i in mine)))
            ov = [] if check else None
            out.update(run(L, alone, [r if r[0] != row else (r[0], (x0, y, x1, y1)) + tuple(r[2:]) for r in rows], [row], ov))
            if check:
                over.extend(ov)
        out.update(run(L, rest, rows, [r[0] for r in rows if r[0] not in dict(reach)], over))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'ettin'); os.makedirs(d, exist_ok=True)
        im = np.max(np.stack([np.asarray(o) for o in over]), axis=0)
        Image.fromarray(im).save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    turn = {nm: body(im)[0] for nm, im, _ in c[1]['turn']}
    k1 = med(c[1]['idle'], 1) / HEIGHT
    kt = k1 * turn['front'] / med(c[1]['idle'])               # the side idle against the turnaround's Front, by area
    k2 = kt * med(c[2]['idle']) / turn['front']
    k3 = kt * med(c[3]['idle']) / turn['back']
    print('  K: sheet 1 %.3f, turnaround %.3f (the side rows %.3f of it; against its Right they would be %.3f), front %.3f, back %.3f; '
          'idle standing: side %d px, from the front %.0f px, from behind %.0f px'
          % (k1, kt, k1 / kt, med(c[1]['idle']) / turn['right'], k2, k3, HEIGHT, med(c[2]['idle'], 1) / k2, med(c[3]['idle'], 1) / k3))
    return {1: k1, 2: k2, 3: k3}


def fits(c):
    """(sheet, row) -> its rows' size against its own idle on sheets 2 and 3 (the median of its frames' sqrt-area over the idle's)"""
    med = lambda frs: float(np.median([body(im)[0] for _, im, _ in frs]))
    f = {(L, row): med(c[L][row]) / med(c[L]['idle']) for L in FIT for row in c[L]}
    print('  FIT (a row against its idle, by area): ' + '; '.join('sheet %d %s' % (L, ', '.join('%s %.3f' % (r, v) for (l, r), v in f.items() if l == L))
                                                                for L in FIT))
    return f


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    fit = fits(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            k = K[L] * fit.get((L, row), 1.0)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, k, TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / k))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, row in ROWS.items():
        side = frames_of(1, row)
        if eng == 'prone':
            side = side[::-1]                            # pushing up, then lying: it lies at its last frame and gets up by playing it backwards
        per = []
        for f in range(8):
            if f == 0 and row in FRONT:
                per.append(frames_of(2, row))
            elif f == 4 and row in BACK:
                per.append(frames_of(3, row))
            else:
                per.append(side)
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    tall = max(AY - np.where(fr[..., 3].any(1))[0][0] for rows in frames.values() for row in rows for fr in row)
    print('  the tallest frame rises %d px over the foot (AY %d, FH %d)' % (tall, AY, FH))
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'ettin_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: three GPT sheets -- the side rows with a turnaround, one from the front, one from behind), '
                      'cut by tools/ettin-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        lineup(os.path.join(ROOT, 'dev', 'visions', 'ettin', 'lineup.png'))


def lineup(path):
    """a gnoll (Medium), the troll (Large), the Orc Skull stand-in and the ettin (E, S, N), at 4x on a grey floor (his size, for Griz's eye)"""
    def first(name, anim, f):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        return im[y:y + an['fh'], 0:an['fw']], an['ax'], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('troll_p1', 'idle', 6), first('ettin_p1', 'idle', 6),
            first('ettin_p2', 'idle', 6), first('ettin_p2', 'idle', 0), first('ettin_p2', 'idle', 4), first('ettin_p2', 'idle', 2)]
    W = sum(a.shape[1] for a, _, _ in figs) + 10 * len(figs)
    top = max(ay for _, _, ay in figs); H = top + max(a.shape[0] - ay for a, _, ay in figs)
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    x = 5
    for a, ax, ay in figs:
        y0 = top - ay
        sub = canvas[y0:y0 + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[..., :3] = (a[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        x += a.shape[1] + 10
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
