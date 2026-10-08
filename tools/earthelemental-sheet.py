"""DEEP16 pipeline 2 (generated art): Griz's GPT sheets of the earth elemental -> earthelemental_p2.

    python tools/earthelemental-sheet.py            (writes deep16/art/earthelemental_p2.png/.json)
    python tools/earthelemental-sheet.py check      (also the cut overlays, dev/visions/earthelemental/cut-<n>.png, the tone's means, and a
                                                     lineup beside the troll, the gnoll and the stand-in it replaces)

Sources (gitignored, the main checkout's -- a worktree reads them there), all in deep16/_src/Fresh/:
  1  Earth Elemental Animation Sheet-2.png -- the first side sheet (asked 10-08 as "The stand-ins' first sheets", deep16-art-in-hand.md): a
     portrait, a turnaround labelled Front, Right, Back, Left ABOVE its stills, then rows facing RIGHT drawn small (its side idle 68 px tall,
     so they played upscaled and soft). Since the re-roll only its turnaround and its side idle are cut: the go-between that sizes sheets 2 and 3.
  2  Front-Facing Earth Elemental Sprite Sheet-3.png (from the front) and 3  Earth elemental back sprite sheet-6.png (from behind), each idle 6,
     walk 8, slam 6, slam 2 6, flinch 4, no turnaround ("The six's fronts and backs", the same file).
  4  Right-facing earth elemental sprite sheet-4.png and 5  Right-facing earth elemental sprite sheet-5.png -- Griz's re-roll of the side, drawn
     larger (10-08), true side view facing right, no portrait or turnaround: sheet 4 idle 6, walk 8, slam 6, slam 2 6, flinch 4; sheet 5 sink 6
     (its 6 deliberately empty, under the floor), rise 6, fall 6, prone 2. They replace every one of sheet 1's side rows. (Large Earth Elemental
     Action Sprite Sheet-2.png and Side-View Earth Elemental Sprite Sheet-3.png, a three-quarter-view pair, are not cut: the paste asked a true
     side view.)
The earth elemental replaces the Blue Demon stand-in, earthelemental_p1 (left on disk).

Rows (the paste's cut-as line): Slam -> `slam` and `attack` (the fallback); Slam 2 -> `slam2` (battle.js plays a row named for the attack,
its second use in a turn on the numbered row: its Multiattack is two Slams); Sink -> `burrow` (Earth Glide going under, its last frame EMPTY:
what shows while it is under -- the bulette's burrow ends on its mound, tools/bulette-sheet.py); Rise -> `reveal` (coming up; its frame 1 is
a few pebbles only, kept); Flinch -> flinch; Fall -> `hurt` (crumbling to a heap); Prone -> `prone` (on its back, then heaving up on one fist:
played the other way, up on the fist then lying, so it lies at its last frame and gets up by playing it backwards -- the goblin's and the
hobgoblin's way, deep16/js/sprites.js S.proneRow and S.proneFrame).
Facings: NE, E and SE take the side rows (sheets 4 and 5) as drawn, SW, W and NW mirrored; S takes the front sheet's rows and N the behind
sheet's for idle, walk, slam (and attack), slam2 and flinch; sink, rise, fall and prone play side-on from S and N too (they read the same from
any side). Every row keeps one frame count in every facing (every sheet came with the same counts: nothing fitted).
Scale: sheet 1's side idle (hunched) stands HEIGHT px; its turnaround meets its side rows by its Right and Left stills against that idle, by
area (the sheet drew its turnaround about 1.7 times its rows); the front and behind sheets' idles stand HEIGHT px too, by height (10-08, his
"stabilize his height": by area against the turnaround's Front and Back stills they had stood 113 and 120 px, a quarter over the side). Sheet 4's side idle
stands HEIGHT px too (no turnaround to meet); sheet 5 meets sheet 4 by its standing frames (sink 1, rise 6, fall 1, by area) against sheet
4's idle. Colour: each later sheet brought to sheet 1's per channel (TONE): the front's and behind's idles by their mean against the
turnaround's Front and Back stills; the re-roll's side, warmer still, by its played mean at game size against the front's and behind's
idles as they play (see TONE).
Kept from the first cut: sheet 1's side rows played at K 0.76 (an upscale, soft); the re-roll's play at K 1.84 and 2.35 (a downscale, crisp).
FIT (the ettin cutter's way, tools/ettin-sheet.py): a row drawn smaller than its own sheet's idle meets that idle by AREA, the median of its
frames' sqrt-area against the idle's -- not by height: a walk leans forward and a swing crouches, so their heights read short even at the
right size. Fitted: every sheet's walk (the side's 0.85 of its idle, the front's 0.89, behind's 0.81) and behind's slam, slam2 and flinch
(0.92, 0.90, 0.85); the rest are within 5% of their idles (the front's slams and flinch, the side's slams and flinch) and keep their sheet's K.
Sheet 5 has no idle and its rows sink, rise and fall: one K.
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
         3: os.path.join('Fresh', 'Earth elemental back sprite sheet-6.png'),
         4: os.path.join('Fresh', 'Right-facing earth elemental sprite sheet-4.png'),
         5: os.path.join('Fresh', 'Right-facing earth elemental sprite sheet-5.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 222, 100, 1024)], portrait=(0, 0, 378, 222),        # (only the turnaround and the side idle: the scale's go-between)
          rows=[('turn', (380, 0, 1100, 222), (19, 36), TURN, [478, 643, 802, 973]),     # (its labels above the stills)
                ('idle', (0, 222, 1536, None), (298, 309), NUM(6), [156, 322, 476, 617, 754, 888])]),
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
  # the re-roll's side sheets: each row name its own box (a walk's or a prone's first pebbles stand as far left as the longest name ends)
  4: dict(text=[(0, 97, 90, 127), (0, 294, 98, 323), (0, 506, 98, 535), (0, 698, 121, 727), (0, 875, 114, 905)],
          rows=[('idle', (0, 0, 1536, None), (196, 211), NUM(6), [228, 447, 650, 860, 1079, 1308]),
                ('walk', (0, None, 1536, None), (388, 403), NUM(8), [199, 358, 519, 689, 866, 1046, 1226, 1416]),
                ('slam', (0, None, 1536, None), (600, 616), NUM(6), [225, 452, 675, 898, 1151, 1391]),
                ('slam2', (0, None, 1536, None), (794, 810), NUM(6), [228, 424, 658, 887, 1126, 1384]),
                ('flinch', (0, None, 1536, None), (990, 1005), NUM(4), [228, 447, 664, 870])]),
  5: dict(text=[(0, 153, 84, 181), (0, 399, 82, 426), (0, 666, 73, 694), (0, 881, 100, 907)],
          rows=[('sink', (0, 0, 1536, None), (252, 272), NUM(5), [232, 468, 697, 932, 1165]),   # (its "6", at 1398, stands over nothing: added empty)
                ('rise', (0, None, 1536, None), (521, 536), NUM(6), [225, 455, 692, 925, 1162, 1397]),
                ('fall', (0, None, 1536, None), (785, 800), NUM(6), [223, 455, 681, 921, 1159, 1397]),
                ('prone', (0, None, 1536, None), (986, 1000), NUM(2), [228, 538])]),
}
SPLIT = {}
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)] -- a frame too small to seed
# itself (the sinking's last pebbles, the rising's first)
FIX = {4: {'walk': [((963, 290, 982, 310), '6'), ((776, 362, 783, 368), '5')],     # (the re-roll's frames stand close: a stone flying between
           'slam': [((1023, 518, 1034, 529), '4'), ((1023, 545, 1043, 567), '4'), ((781, 567, 797, 583), '3')],      # two was split down
           'slam2': [((563, 699, 579, 716), '3'), ((781, 702, 798, 721), '3'), ((769, 719, 785, 735), '3'),           # the middle; each goes
                     ((1005, 755, 1020, 772), '5')]},                                                                # whole to the frame
       5: {'sink': [((589, 209, 611, 234), '3')],                                                                    # that held most of it)
           'rise': [((1301, 458, 1325, 485), '6'), ((1066, 465, 1090, 491), '5')],
           'fall': [((329, 691, 352, 718), '2')],
           'prone': [((394, 873, 410, 890), '1'), ((389, 906, 413, 933), '1')]}}
CUT = {}
TOUCH_OK = {}
EMPTY = {(5, 'sink'): 5}   # (sheet, row) -> where an empty frame goes: the sink's 6, under the floor

# the engine's rows: (sheet, row) for the side; S and N as described in the head
SIDE = (4, 5)              # the side sheets (sheet 1's rows are no longer played)
FRONT, BACK = ('idle', 'walk', 'slam', 'slam2', 'flinch'), ('idle', 'walk', 'slam', 'slam2', 'flinch')   # sheet 2's rows for S, sheet 3's for N
ROWS = {'idle': (4, 'idle'), 'walk': (4, 'walk'), 'attack': (4, 'slam'), 'slam': (4, 'slam'), 'slam2': (4, 'slam2'), 'burrow': (5, 'sink'),
        'reveal': (5, 'rise'), 'flinch': (4, 'flinch'), 'hurt': (5, 'fall'), 'prone': (5, 'prone')}
STAND5 = [('sink', 0), ('rise', -1), ('fall', 0)]   # sheet 5's standing frames, its scale against sheet 4's idle
# the rows that meet their own sheet's idle by area (see the head): more than about 8% under it. Behind's slam is on the line (0.920, its
# standing frames 0.94 and 0.91) and goes with its slam2 (0.899), the two blows of one Multiattack played back to back
FIT = {2: ('walk',), 3: ('walk', 'slam', 'slam2', 'flinch'), 4: ('walk',)}
NEW = ['slam', 'slam2']   # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'slam': 10, 'slam2': 10, 'burrow': 7, 'reveal': 7, 'flinch': 10, 'hurt': 7, 'prone': 6}
# per channel, each later sheet's figure brought to sheet 1's: its idle's mean RGB against sheet 1's turnaround still of the same side
TONE = {2: (0.905, 0.943, 1.038), 3: (0.933, 0.963, 1.013),   # (the front's idle 104 84 63 to the Front still's 94 79 65; behind, 104 86 67 to
                                                              # the Back still's 97 83 67 -- both drawn warmer, 10-08)
        4: (0.876, 0.949, 1.095), 5: (0.815, 0.905, 1.036)}   # (the re-roll came warmer still -- 112 87 62 and 118 90 65 on the sheet. Fitted at
        # GAME size, where it plays: the snapped pixels' mean, outline left out, brought to the front's and behind's idles as they play, 103 85 69
        # -- sheet 4 by its idle, sheet 5 by its standing frames; untoned the side played 118 91 67 and 125 95 70. On the sheet's own means the
        # tone came stronger, 0.83 0.90 1.06: these sheets are drawn larger and box down further, so their dark seams average out brighter)
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
    a2 = kt * med(c[2]['idle']) / turn['front']   # (by area against the turnaround, as first cut: the front stood 113 px and behind 120,
    a3 = kt * med(c[3]['idle']) / turn['back']    # a quarter over the side's 90 -- it grew every time it turned toward or away)
    # (since 10-08, Griz: "Please try to stabilize his height. I'd think bringing the front and back views down to the size of the rest would be the
    # efficient approach": the front's and behind's idles stand the side idle's HEIGHT, by height)
    k2 = med(c[2]['idle'], 1) / HEIGHT
    k3 = med(c[3]['idle'], 1) / HEIGHT
    print('  K by area against the turnaround (the first cut): the front %.3f, behind %.3f -- now by height, %.3f and %.3f' % (a2, a3, k2, k3))
    print('  K: sheet 1 %.3f, the turnaround %.3f (%.2f of its rows), the front %.3f, behind %.3f; sheet 1\'s side idle %d px (on the sheet '
          '%.0f), the turnaround standing %.0f px (Right) and %.0f (Front), from the front %.0f px, from behind %.0f px'
          % (k1, kt, kt / k1, k2, k3, HEIGHT, med(c[1]['idle'], 1), body(c[1]['turn'][1][1])[1] / kt, body(c[1]['turn'][0][1])[1] / kt,
             med(c[2]['idle'], 1) / k2, med(c[3]['idle'], 1) / k3))
    k4 = med(c[4]['idle'], 1) / HEIGHT                       # the re-roll's side idle stands where sheet 1's did
    stand5 = float(np.median([body(c[5][row][i][1])[0] for row, i in STAND5]))
    k5 = k4 * stand5 / med(c[4]['idle'])
    print('  K: the re-roll\'s side, sheet 4 %.3f (its idle %d px, on the sheet %.0f; its walk %.0f px), sheet 5 %.3f (%.3f of sheet 4: its '
          'standing frames %s px)' % (k4, HEIGHT, med(c[4]['idle'], 1), med(c[4]['walk'], 1) / k4, k5, k5 / k4,
                                      '/'.join('%.0f' % (body(c[5][row][i][1])[1] / k5) for row, i in STAND5)))
    return {1: k1, 2: k2, 3: k3, 4: k4, 5: k5}


def fits(c, K):
    """(sheet, row) -> its size against its own sheet's idle, by area (the median of its frames' sqrt-area over the idle's), for FIT's rows"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    every = {(L, row): med(c[L][row]) / med(c[L]['idle']) for L in (2, 3, 4) for row in c[L]}
    print('  rows against their idle, by area: ' + '; '.join('sheet %d %s' % (L, ', '.join('%s %.3f%s' % (r, v, '*' if r in FIT.get(L, ()) else '')
                                                           for (l, r), v in every.items() if l == L and r != 'idle')) for L in (2, 3, 4)) + '  (* fitted)')
    f = {(L, row): every[(L, row)] for L in FIT for row in FIT[L]}
    for (L, row), v in f.items():
        print('  FIT sheet %d %s: K %.3f -> %.3f, standing %.0f px -> %.0f px (its idle %.0f)'
              % (L, row, K[L], K[L] * v, med(c[L][row], 1) / K[L], med(c[L][row], 1) / (K[L] * v), med(c[L]['idle'], 1) / K[L]))
    return f


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    fit = fits(c, K)
    if check:
        tf, tb = mean_rgb(c[1]['turn'][0:1]), mean_rgb(c[1]['turn'][2:3])
        for L, ref, nm in ((2, tf, 'front'), (3, tb, 'back')):
            m = mean_rgb(c[L]['idle'])
            print('  tone: sheet %d idle %s, the turnaround %s %s -> %s' % (L, np.round(m).astype(int), nm, np.round(ref).astype(int),
                                                                          tuple(round(float(x), 3) for x in ref / m)))
        ts = mean_rgb([c[1]['turn'][1], c[1]['turn'][3]])
        for L, frs in ((4, c[4]['idle']), (5, [c[5][row][i] for row, i in STAND5])):
            m = mean_rgb(frs)
            print('  tone: sheet %d %s on the sheet, the turnaround right and left %s -> %s (TONE is fitted at game size instead: %s)'
                  % (L, np.round(m).astype(int), np.round(ts).astype(int), tuple(round(float(x), 3) for x in ts / m), TONE[L]))
        print('  sheet 1 side idle %s (its rows as they played before the re-roll)' % np.round(mean_rgb(c[1]['idle'])).astype(int))
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
            if f == 0 and L in SIDE and row in FRONT:
                per.append(frames_of(2, row))
            elif f == 4 and L in SIDE and row in BACK:
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
    meta['source'] = ('generated by Griz (2026-10-08: GPT sheets -- the side with its turnaround, one from the front and one from behind, '
                      'then the side re-rolled larger on two sheets), cut by tools/earthelemental-sheet.py')
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
