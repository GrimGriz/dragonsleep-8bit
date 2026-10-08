"""DEEP16 pipeline 2 (generated art): Griz's three GPT sheets of the earth elemental -> earthelemental_p2.

    python tools/earthelemental-sheet.py            (writes deep16/art/earthelemental_p2.png/.json)
    python tools/earthelemental-sheet.py check      (also the cut overlays, dev/visions/earthelemental/cut-<n>.png, the tone's means, and a
                                                     lineup beside the troll, the gnoll and the stand-in it replaces)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Fresh/Earth Elemental Animation Sheet-2.png (the side,
asked 10-08 as "The stand-ins' first sheets", deep16-art-in-hand.md: a portrait, a turnaround labelled Front, Right, Back, Left ABOVE its stills,
then rows facing RIGHT, numbered under each frame: idle 6, walk 8, slam 6, slam 2 6, sink 6 -- its 6 deliberately empty, under the floor --
rise 6, flinch 4, fall 6, prone 2), then Front-Facing Earth Elemental Sprite Sheet-3.png (from the front) and Earth elemental back sprite
sheet-6.png (from behind), each idle 6, walk 8, slam 6, slam 2 6, flinch 4, no turnaround ("The six's fronts and backs", the same file).
The earth elemental replaces the Blue Demon stand-in, earthelemental_p1 (left on disk).

Rows (the paste's cut-as line): Slam -> `slam` and `attack` (the fallback); Slam 2 -> `slam2` (battle.js plays a row named for the attack,
its second use in a turn on the numbered row: its Multiattack is two Slams); Sink -> `burrow` (Earth Glide going under, its last frame EMPTY:
what shows while it is under -- the bulette's burrow ends on its mound, tools/bulette-sheet.py); Rise -> `reveal` (coming up; its frame 1 is
a few pebbles only, kept); Flinch -> flinch; Fall -> `hurt` (crumbling to a heap); Prone -> `prone` (on its back, then heaving up on one fist:
played the other way, up on the fist then lying, so it lies at its last frame and gets up by playing it backwards -- the goblin's and the
hobgoblin's way, deep16/js/sprites.js S.proneRow and S.proneFrame).
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored; S takes the front sheet's rows and N the behind sheet's for idle,
walk, slam (and attack), slam2 and flinch; sink, rise, fall and prone play side-on from S and N too (they read the same from any side).
Every row keeps one frame count in every facing (the front and behind sheets came with sheet 1's counts: nothing fitted).
Scale: the side idle (hunched) stands HEIGHT px; the turnaround meets the side rows by its Right and Left stills against the side idle, by
area (the sheet drew its turnaround about 1.6 times its rows); the front sheet meets the turnaround by its idle against the Front still and
the behind sheet by its idle against the Back still, by area. Colour: each later sheet brought to sheet 1's per channel (TONE) by its idle's
mean against the turnaround's still of the same side.
"""
import os, sys, json, subprocess
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

FILES = {1: os.path.join('Fresh', 'Earth Elemental Animation Sheet-2.png'),
         2: os.path.join('Fresh', 'Front-Facing Earth Elemental Sprite Sheet-3.png'),
         3: os.path.join('Fresh', 'Earth elemental back sprite sheet-6.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 222, 100, 1024)], portrait=(0, 0, 378, 222),
          rows=[('turn', (380, 0, 1100, 222), (19, 36), TURN, [478, 643, 802, 973]),     # (its labels above the stills)
                ('idle', (0, 222, 1536, None), (298, 309), NUM(6), [156, 322, 476, 617, 754, 888]),
                ('walk', (0, None, 1536, None), (389, 400), NUM(8), [164, 299, 438, 573, 706, 856, 1031, 1173]),
                ('slam', (0, None, 1536, None), (479, 489), NUM(6), [154, 310, 471, 646, 816, 978]),
                ('slam2', (0, None, 1536, None), (570, 580), NUM(6), [171, 324, 492, 666, 829, 992]),
                ('sink', (0, None, 1536, None), (646, 660), NUM(5), [164, 324, 492, 656, 818]),   # (its "6" stands over nothing: added empty)
                ('rise', (0, None, 1536, None), (743, 754), NUM(6), [166, 324, 492, 648, 822, 990]),
                ('flinch', (0, None, 1536, None), (828, 838), NUM(4), [157, 310, 464, 608]),
                ('fall', (0, None, 1536, None), (909, 919), NUM(6), [170, 320, 476, 626, 776, 927]),
                ('prone', (0, None, 1536, None), (997, 1008), NUM(2), [182, 348])]),
  2: dict(text=[(0, 0, 120, 1024)],
          rows=[('idle', (0, 0, 1536, None), (196, 211), NUM(6), [227, 444, 649, 856, 1065, 1276]),
                ('walk', (0, None, 1536, None), (386, 404), NUM(8), [198, 376, 546, 713, 891, 1071, 1252, 1429]),
                ('slam', (0, None, 1536, None), (592, 608), NUM(6), [222, 448, 659, 866, 1082, 1291]),
                ('slam2', (0, None, 1536, None), (789, 805), NUM(6), [218, 445, 656, 870, 1083, 1301]),
                ('flinch', (0, None, 1536, None), (984, 999), NUM(4), [224, 459, 681, 907])]),
  3: dict(text=[(0, 0, 116, 1024)],
          rows=[('idle', (0, 0, 1536, None), (208, 222), NUM(6), [209, 417, 626, 831, 1033, 1233]),
                ('walk', (0, None, 1536, None), (409, 423), NUM(8), [192, 355, 527, 699, 868, 1041, 1221, 1400]),
                ('slam', (0, None, 1536, None), (607, 621), NUM(6), [223, 456, 682, 920, 1152, 1380]),
                ('slam2', (0, None, 1536, None), (798, 812), NUM(6), [223, 457, 682, 920, 1148, 1379]),
                ('flinch', (0, None, 1536, None), (984, 998), NUM(4), [223, 446, 662, 865])]),
}
SPLIT = {}
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)] -- a frame too small to seed
# itself (the sinking's last pebbles, the rising's first)
FIX = {1: {'sink': [((765, 615, 870, 645), '5')],          # (its last pebbles and the eyes' glint, a core of 58 px)
           'rise': [((110, 700, 225, 740), '1')]}}         # (a few pebbles only, a core of 19 px: kept)
CUT = {}
TOUCH_OK = {}
EMPTY = {(1, 'sink'): 5}   # (sheet, row) -> where an empty frame goes: the sink's 6, under the floor

# the engine's rows: (sheet, row) for the side; S and N as described in the head
FRONT, BACK = ('idle', 'walk', 'slam', 'slam2', 'flinch'), ('idle', 'walk', 'slam', 'slam2', 'flinch')   # sheet 2's rows for S, sheet 3's for N
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'attack': (1, 'slam'), 'slam': (1, 'slam'), 'slam2': (1, 'slam2'), 'burrow': (1, 'sink'),
        'reveal': (1, 'rise'), 'flinch': (1, 'flinch'), 'hurt': (1, 'fall'), 'prone': (1, 'prone')}
NEW = ['slam', 'slam2']   # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'slam': 10, 'slam2': 10, 'burrow': 7, 'reveal': 7, 'flinch': 10, 'hurt': 7, 'prone': 6}
# per channel, each later sheet's figure brought to sheet 1's: its idle's mean RGB against sheet 1's turnaround still of the same side
TONE = {2: (0.905, 0.943, 1.038), 3: (0.933, 0.963, 1.013)}   # (the front's idle 104 84 63 to the Front still's 94 79 65; behind, 104 86 67 to
                                                              # the Back still's 97 83 67 -- both drawn warmer, 10-08)
HEIGHT = 90           # the hunched side idle, standing px
FH, AY = 140, 128


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the torso; an arm and the flying stones are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled) and its height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def mean_rgb(frs):
    px = np.concatenate([np.asarray(im)[np.asarray(im)[..., 3] > 0][:, :3] for _, im, _ in frs]).astype(float)
    return px.mean(0)


def place(a, x_ref, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    if a is None:                                                 # (an empty frame: under the floor)
        return out, False
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def cut(L, check=False):
    s = SHEETS[L]
    rows, prev = [], None
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:                            # (the row above ends there too)
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2                                   # a row's band: the middle of the strip above to the middle of its own
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    if 'portrait' in s:
        spec['portrait'] = s['portrait']
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'earthelemental'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    turn = {nm: body(im)[0] for nm, im, _ in c[1]['turn']}
    kt = k1 * (turn['right'] + turn['left']) / 2 / med(c[1]['idle'])
    k2 = kt * med(c[2]['idle']) / turn['front']
    k3 = kt * med(c[3]['idle']) / turn['back']
    print('  K: the side rows %.3f, the turnaround %.3f (%.2f of the rows), the front %.3f, behind %.3f; the side idle %d px (on the sheet %.0f), '
          'the turnaround standing %.0f px (Right) and %.0f (Front), from the front %.0f px, from behind %.0f px'
          % (k1, kt, kt / k1, k2, k3, HEIGHT, med(c[1]['idle'], 1), body(c[1]['turn'][1][1])[1] / kt, body(c[1]['turn'][0][1])[1] / kt,
             med(c[2]['idle'], 1) / k2, med(c[3]['idle'], 1) / k3))
    return {1: k1, 2: k2, 3: k3}


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    if check:
        tf, tb = mean_rgb(c[1]['turn'][0:1]), mean_rgb(c[1]['turn'][2:3])
        for L, ref, nm in ((2, tf, 'front'), (3, tb, 'back')):
            m = mean_rgb(c[L]['idle'])
            print('  tone: sheet %d idle %s, the turnaround %s %s -> %s' % (L, np.round(m).astype(int), nm, np.round(ref).astype(int),
                                                                          tuple(round(float(x), 3) for x in ref / m)))
        print('  side idle %s, turnaround right %s' % (np.round(mean_rgb(c[1]['idle'])).astype(int), np.round(mean_rgb(c[1]['turn'][1:2])).astype(int)))
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            if (L, row) in EMPTY:
                out.insert(EMPTY[(L, row)], (None, 0.0, 0))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        if eng == 'prone':
            side = side[::-1]                            # up on a fist, then lying: it lies at its last frame and gets up by playing it backwards
        per = []
        for f in range(8):
            if f == 0 and L == 1 and row in FRONT:
                per.append(frames_of(2, row))
            elif f == 4 and L == 1 and row in BACK:
                per.append(frames_of(3, row))
            else:
                per.append(side)
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs if a is not None)   # each row its own width, about the middle
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if a is not None and f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(sorted(set(lost))))
    ink = [np.where(fr[..., 3].any(1))[0] for e in frames for fs in frames[e] for fr in fs if fr[..., 3].any()]
    print('  ink rows over every frame: %d-%d of %d (foot %d)' % (min(r[0] for r in ink), max(r[-1] for r in ink), FH, AY))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'earthelemental_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: three GPT sheets -- the side with its turnaround, then one from the front and one '
                      'from behind), cut by tools/earthelemental-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'earthelemental')
        lineup(os.path.join(d, 'lineup.png'))


def lineup(path):
    """the gnoll (Medium), the stand-in it replaces, him (E, S, N), the troll (Large), at 4x on a grey floor (his size, for Griz's eye)"""
    def first(name, anim, f):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        return im[y:y + an['fh'], 0:an['fw']], an['ax'], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('earthelemental_p1', 'idle', 6), first('earthelemental_p2', 'idle', 6),
            first('earthelemental_p2', 'idle', 0), first('earthelemental_p2', 'idle', 4), first('troll_p1', 'idle', 6)]
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
    canvas[top, :, :3] = (150, 60, 60)                           # (the foot line)
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
