"""DEEP16 pipeline 2 (generated art): Griz's two GPT sheets of GreyFang, the grizzled ranger -> greyfang_p1.

    python tools/greyfang-sheet.py            (writes deep16/art/greyfang_p1.png/.json)
    python tools/greyfang-sheet.py check      (also the cut overlays, dev/visions/greyfang/cut-<n>.png, a contact strip of every row and a lineup beside Talmok)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Fresh/Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png
and Greyfang's extra moves sprite sheet-2.png (a CURLY apostrophe in the second's name) -- Griz, 2026-10-08. GreyFang: a man with a wolf's head,
a grizzled veteran ranger in a torn green cloak, a longbow in his hand, a quiver of arrows on his back, a sword for the close work.
Not ruled how the game plays him -- the seat's (deep16/js/classes.js, data/foes.js); this cuts every row under the names the engine reads.

Each sheet: a portrait, a turnaround (front, right, back, left), then rows facing RIGHT, labelled by number. Sheet 1: idle 2, walk 9, bow 13,
hurt 6, cast 7. Sheet 2: slash 6, volley 8, whirlwind 8, climb 6, prone 2, fall 6, parry 6, backstep 6. Sheet 2's turnaround holds a sword in
its Right still, so the scale and the stills are sheet 1's; sheet 2's is cut only to tone against (its front, back and left carry the same kit).
Engine rows: `idle` <- Idle; `walk` <- Walk; `longbow` <- Bow (the engine plays a row named for the blow, lower-cased, battle.js attack: his
Longbow; a blow named Shortbow would find no row and play `attack`); `attack` and `slash` <- Slash; `cast` <- Cast; `climb` <- Climb; `flinch` <-
Hurt (a blow that lands and doesn't drop him); `hurt` <- Fall (he goes down, the bow dropped: the engine's `hurt` is the fall); `prone` <-
Prone, played in reverse (the sheet draws him lying then pushing up on an arm; the engine falls through the row, lies at its last frame and gets
up backwards -- sprites.js S.proneRow, the hobgoblin's way). New rows, named here (not in pixelate.py): `volley` (the Hunter's Volley: its
`release` is where the three arrows leave), `whirlwind` (Whirlwind Attack), `parry`, `backstep`; and `slash`. `longbow`'s `release` is the frame
the string hand lets go (the arrow is gone from the bow: 10 of 13).
Facings: E takes the side rows as drawn, W mirrored. His four isometric sheets (10-08, sheets 3-6: BOTTOM RIGHT, BOTTOM LEFT -- the last of two,
its volley shooting the right way -- TOP LEFT, TOP RIGHT) give SE, SW, NW and NE their own drawings, no mirror, of the seven rows they carry:
slash (and attack), volley, whirlwind, parry, backstep, prone, the fall (hurt); S borrows the bottom-right's and N the top-right's (ISO_NEAR).
The rows they don't carry (walk, longbow, cast, climb, flinch) play side-on there, SW and NW mirrored. The idle: S the turnaround's Front
still and N its Back (one still in both frames); each diagonal its sheet's standing still (STILLS: cut out first, then painted navy), the
bottom-left -- which has none -- the bottom-right's mirrored. Each isometric sheet meets sheet 2 by height (the five rows' first frames, the
guard) and is toned to sheet 2's same rows.
Scale: the side idle stands HEIGHT px -- as tall as Talmok's (talmok_p1's side idle, 63 px with its outline); sheet 2 meets sheet 1 by the
guard both draw (sheet 1's idle against the first frames of sheet 2's slash, parry and backstep, by area); the turnaround's Front still
stands STILL_H by height (upright, against the rows' deep crouch: by area it stood 84 and a turn popped -- scales()). Colour: sheet 2 drew him warmer or cooler than sheet 1 (the most-played rows), so it is brought to
sheet 1's per channel (TONE, the twin's way: sheet 2's front, back and left stills against sheet 1's). The twin is tools/mirrorgnoll-sheet.py.
"""
import os, sys, json, subprocess, tempfile
import importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

FILES = {1: os.path.join('Fresh', 'Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png'),
         2: os.path.join('Fresh', 'Greyfang’s extra moves sprite sheet-2.png'),     # (a curly apostrophe)
         # his four isometric sheets (10-08, Griz: "the art department is putting out sprites thinking this is a 2D game. It's now generating
         # based on isometry"): sheet 2's moves from each screen diagonal, one sheet a view; the bottom-left is the last of two ("Use the last
         # bottom-left image -- it corrects the Volley's firing direction": Greyfang isometric combat sprite sheet-2.png's volley shot right)
         3: os.path.join('Fresh', 'Greyfang’s Isometric Combat Sprite Sheet-1.png'),   # BOTTOM RIGHT -> SE (a curly apostrophe)
         4: os.path.join('Fresh', "GreyFang's Eight-Frame Bow Volley-5.png"),           # BOTTOM LEFT -> SW
         5: os.path.join('Fresh', 'Greyfang Isometric Combat Sprite Sheet-3.png'),      # TOP LEFT (titled only GREYFANG) -> NW
         6: os.path.join('Fresh', 'Greyfang isometric combat sprite sheet-4.png')}      # TOP RIGHT -> NE
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the title, the row names; every row's number strip is added below), and its rows:
# (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 0, 640, 45), (0, 280, 100, 1024)],
          rows=[('turn', (300, 0, 960, 250), (250, 274), TURN, [383, 527, 688, 852]),
                ('idle', (0, 272, 1536, None), (380, 394), NUM(2), [145, 282]),
                ('walk', (0, None, 1536, None), (511, 526), NUM(9), [145, 282, 415, 553, 680, 818, 954, 1084, 1215]),
                ('bow', (0, None, 1536, None), (660, 676), NUM(13), [146, 260, 376, 482, 590, 704, 810, 922, 1039, 1147, 1256, 1362, 1472]),
                ('hurt', (0, None, 1536, None), (808, 823), NUM(6), [147, 284, 435, 572, 712, 858]),
                ('cast', (0, None, 1536, None), (958, 973), NUM(7), [144, 270, 408, 542, 678, 817, 959])]),
  2: dict(text=[(0, 0, 640, 45), (0, 222, 168, 1024)],
          rows=[('turn', (300, 0, 960, 204), (201, 226), TURN, [378, 528, 681, 836]),
                ('slash', (0, 221, 1536, None), (309, 328), NUM(6), [210, 366, 537, 718, 889, 1036]),
                ('volley', (0, None, 1536, None), (413, 432), NUM(8), [210, 368, 538, 690, 860, 1014, 1180, 1346]),
                ('whirlwind', (0, None, 1536, None), (526, 546), NUM(8), [210, 366, 536, 704, 877, 1067, 1248, 1416]),
                ('climb', (0, None, 1536, None), (628, 648), NUM(6), [208, 366, 523, 668, 818, 968]),
                ('prone', (0, None, 1536, None), (694, 712), NUM(2), [232, 403]),
                ('fall', (0, None, 1536, None), (787, 805), NUM(6), [191, 340, 492, 656, 822, 1003]),
                ('parry', (0, None, 1536, None), (892, 911), NUM(6), [211, 369, 525, 698, 872, 1049]),
                ('backstep', (0, None, 1536, None), (998, 1016), NUM(6), [205, 380, 573, 759, 954, 1134])]),
  # the isometric four: the same seven rows each, the numbers' x off the seat's probe (10-08)
  3: dict(text=[(0, 0, 600, 50), (0, 120, 180, 1024)],
          rows=[('slash', (0, 119, 1536, None), (228, 245), NUM(6), [244, 403, 572, 730, 901, 1066]),
                ('volley', (0, None, 1536, None), (359, 375), NUM(8), [244, 390, 544, 703, 864, 1024, 1203, 1358]),
                ('whirlwind', (0, None, 1536, None), (495, 515), NUM(8), [246, 393, 565, 733, 908, 1082, 1259, 1430]),
                ('parry', (0, None, 1536, None), (629, 647), NUM(6), [244, 412, 588, 762, 934, 1106]),
                ('backstep', (0, None, 1536, None), (765, 782), NUM(6), [246, 416, 593, 764, 933, 1094]),
                ('prone', (0, None, 1536, None), (864, 879), NUM(2), [262, 483]),
                ('fall', (0, None, 1536, None), (989, 1005), NUM(6), [220, 373, 540, 718, 911, 1127])]),
  4: dict(text=[(0, 0, 560, 50), (0, 60, 165, 1024), (0, 360, 174, 412)],      # (the last: "Whirlwind", its d past the column)
          rows=[('slash', (0, 55, 1536, None), (178, 195), NUM(6), [261, 428, 600, 785, 986, 1164]),
                ('volley', (0, None, 1536, None), (313, 330), NUM(8), [240, 402, 566, 725, 887, 1060, 1256, 1424]),
                ('whirlwind', (0, None, 1536, None), (462, 479), NUM(8), [250, 410, 578, 747, 926, 1092, 1268, 1434]),
                ('parry', (0, None, 1536, None), (606, 622), NUM(6), [249, 430, 600, 765, 967, 1147]),
                ('backstep', (0, None, 1536, None), (744, 761), NUM(6), [248, 416, 598, 776, 962, 1148]),
                ('prone', (0, None, 1536, None), (848, 864), NUM(2), [250, 472]),
                ('fall', (0, None, 1536, None), (977, 993), NUM(6), [240, 414, 598, 776, 970, 1192])]),
  5: dict(text=[(0, 0, 245, 55), (0, 140, 155, 1024), (0, 395, 172, 445)],
          rows=[('slash', (0, 110, 1536, None), (236, 252), NUM(6), [236, 418, 626, 820, 1036, 1220]),
                ('volley', (0, None, 1536, None), (369, 386), NUM(8), [228, 396, 568, 732, 904, 1112, 1276, 1422]),
                ('whirlwind', (0, None, 1536, None), (500, 517), NUM(8), [240, 406, 583, 745, 929, 1080, 1282, 1454]),   # (6 nudged from 1111: its sword's trail, joined to him, has a thick crescent nearer 5's number)
                ('parry', (0, None, 1536, None), (627, 644), NUM(6), [224, 394, 581, 736, 916, 1100]),
                ('backstep', (0, None, 1536, None), (758, 774), NUM(6), [221, 406, 589, 773, 954, 1124]),
                ('prone', (0, None, 1536, None), (856, 872), NUM(2), [244, 462]),
                ('fall', (0, None, 1536, None), (978, 995), NUM(6), [214, 388, 562, 730, 919, 1119])]),
  6: dict(text=[(0, 0, 510, 55), (0, 140, 162, 1024), (0, 415, 182, 470)],
          rows=[('slash', (0, 128, 1536, None), (235, 253), NUM(6), [240, 418, 606, 780, 970, 1163]),
                ('volley', (0, None, 1536, None), (365, 383), NUM(8), [242, 406, 568, 730, 898, 1055, 1240, 1408]),
                ('whirlwind', (0, None, 1536, None), (494, 513), NUM(8), [244, 412, 570, 742, 919, 1092, 1260, 1426]),
                ('parry', (0, None, 1536, None), (622, 640), NUM(6), [240, 410, 588, 758, 948, 1125]),
                ('backstep', (0, None, 1536, None), (750, 770), NUM(6), [242, 410, 596, 771, 948, 1124]),
                ('prone', (0, None, 1536, None), (854, 869), NUM(2), [246, 457]),
                ('fall', (0, None, 1536, None), (977, 995), NUM(6), [242, 425, 602, 786, 984, 1182])]),
}
# the isometric sheets' standing stills (one figure, no number): the box it lies in -- cut out first, then painted navy so the slash row
# below it (the top-left's, whose first two frames reach up beside it) doesn't take a piece of it
STILLS = {3: [(620, 8, 756, 119)], 5: [(248, 5, 372, 135)], 6: [(530, 4, 628, 52), (508, 52, 628, 130)]}   # (boxes, joined: the top-right's title ends at x 520)
ISO = {7: 3, 1: 4, 3: 5, 5: 6}            # facing (SE, SW, NW, NE) -> its isometric sheet, drawn as it faces (no mirror)
ISO_NEAR = {0: 3, 4: 6}                   # S and N: the nearer three-quarter view (S the bottom-right's, N the top-right's) for the rows it has
ISO_ROWS = {'attack': 'slash', 'slash': 'slash', 'volley': 'volley', 'whirlwind': 'whirlwind', 'parry': 'parry', 'backstep': 'backstep',
            'prone': 'prone', 'hurt': 'fall'}       # engine row -> the isometric sheets' row; the rest (idle, walk, longbow, cast, climb, flinch) play side-on there
ISO_GUARD = ['slash', 'volley', 'whirlwind', 'parry', 'backstep']   # first frames: the guard each view and sheet 2 both stand in (scale by height)
SPLIT = {(2, 'fall'): 696, (2, 'parry'): 788}   # (sheet, row) -> the line between it and the row above, by hand where the two crowd: prone's feet end at 691 and fall 1's ears start at 701; fall's feet end at 784 and parry 2's dotted arc starts at 791
ERASE = {}            # a number that touches a figure: its glyph painted navy before the cut
BLANK = {1: [(0, 45, 298, 274)]}     # the portrait (the cut has no use for it)
FIX = {2: {'volley': [((1046, 326, 1120, 372), '6')]},   # loose bits by hand: volley 6's three arrows: a loose blob is dealt out pixel by pixel to the nearest body, and the heads lie nearer frame 7's
       3: {'volley': [((1045, 262, 1135, 326), '6')]},      # the bottom-right's and top-right's volley 6: the arrows' heads lie nearer frame 7's feet
       6: {'volley': [((1118, 248, 1178, 315), '6')]},
       5: {'volley': [((980, 255, 1060, 318), '6')],        # the top-left's volley 6: its three arrows lie left of him, nearer frame 5
           'backstep': [((500, 718, 550, 750), '3')]},      # and its backstep 3's speed lines, a speck of them dealt to 2
       4: {'parry': [((875, 530, 932, 595), '5')],          # the bottom-left's parry 5: its swoosh, a speck of it dealt to 4
           'whirlwind': [((826, 355, 902, 412), '5'),       # and its whirlwind 5's arc, whose tail reaches back to 4's sword;
                         ((1160, 378, 1232, 430), '7'),     # 7's arc, both ends (its left tip met 6's sword)
                         ((1305, 366, 1358, 424), '7')]}}
CUT = {}
TOUCH_OK = {}

# the engine's rows: engine name -> (sheet, row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'longbow': (1, 'bow'), 'attack': (2, 'slash'), 'slash': (2, 'slash'), 'cast': (1, 'cast'),
        'climb': (2, 'climb'), 'flinch': (1, 'hurt'), 'hurt': (2, 'fall'), 'prone': (2, 'prone'), 'volley': (2, 'volley'),
        'whirlwind': (2, 'whirlwind'), 'parry': (2, 'parry'), 'backstep': (2, 'backstep')}
ROWS['headless'] = (2, 'headless')
# THE HEADLESS ROW (10-08, the Harbinger's story fight -- Griz: "I was thinking a headless sprite falling across the screen onto the grid prone"; "you're
# kinda the GreyFang sprite guy, no window better suited to finish him off"): his side Fall, each frame's head cleared away by hand -- the box the head fills
# on sheet 2 (x0, y0, x1, y1), every figure pixel in it gone but the dropped bow's (frame 6: orange, in the box's lower right). No blood: the hood's edge
# is the cut, and the outline pass draws it. js/trophy.js plays it as the body falls onto the grid, and holds its last frame
HEADLESS = [(186, 694, 226, 732), (343, 708, 378, 741), (512, 718, 550, 751), (673, 732, 707, 768), (836, 733, 880, 773), (1016, 745, 1058, 776)]


def headless(im, box, hb):
    a = np.asarray(im).copy()
    x0, y0, x1, y1 = hb[0] - box[0], hb[1] - box[1], hb[2] - box[0], hb[3] - box[1]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(a.shape[1], x1), min(a.shape[0], y1)
    reg = a[y0:y1, x0:x1].astype(int)
    r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
    yy, xx = np.mgrid[0:reg.shape[0], 0:reg.shape[1]]
    bow = (r > 140) & (g < 130) & (b < 90) & (r - g > 50) & (xx > reg.shape[1] * 0.7) & (yy > reg.shape[0] * 0.5)
    a[y0:y1, x0:x1, 3][~bow] = 0
    lab, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))   # (the scraps the cut leaves, under 6 px, go too)
    if n:
        sz = ndimage.sum(a[..., 3] > 0, lab, range(1, n + 1))
        a[..., 3][np.isin(lab, 1 + np.where(sz < 6)[0])] = 0
    return Image.fromarray(a, 'RGBA')


REVERSED = {'prone'}                      # played backwards: the sheet's lying-then-pushing-up, so he lies at the last frame
STILL = {'idle': {0: 'front', 4: 'back'}}      # facing -> the turnaround's still, for this row (the other rows play side-on from S and N)
NEW = ['slash', 'volley', 'whirlwind', 'parry', 'backstep', 'headless']    # this cutter's own rows (named here, not in pixelate.py)
FPS = {'headless': 8, 'idle': 4, 'walk': 10, 'longbow': 12, 'attack': 12, 'slash': 12, 'cast': 8, 'climb': 8, 'flinch': 10, 'hurt': 8, 'prone': 8,
       'volley': 12, 'whirlwind': 14, 'parry': 10, 'backstep': 12}
RELEASE = {'longbow': 9, 'volley': 5}     # the frame the arrow(s) are gone from the string: js/battle.js times the shot by it (0-based)
GUARD = [('slash', 0), ('parry', 0), ('backstep', 0)]      # sheet 2 frames that stand in sheet 1's idle guard
TONE = {2: (0.886, 0.922, 1.026),   # (pooled over the front, back and left stills: sheet 2's 80.9 67.0 47.8 to sheet 1's 71.7 61.8 49.0)
        # the isometric four drew him warmer again: each brought to sheet 2's same seven rows, toned (73.1 64.4 57.4), from its own --
        3: (0.896, 0.976, 1.125),   # 81.6 66.0 51.0
        4: (0.913, 1.006, 1.112),   # 80.1 64.0 51.6
        5: (0.916, 0.960, 1.112),   # 79.8 67.1 51.6
        6: (0.839, 0.887, 1.049)}   # 87.1 72.6 54.7
HEIGHT = 60           # the side idle, standing px before the outline (Talmok's 63 with it)
STILL_H = 67          # the turnaround's Front still, px before the outline (S 68, N 69 with it, the side idle 63): see scales()
FH, AY = 112, 100


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
    """x of the body's thick middle (torso and head; the arms and the tail are thin), the steadiest thing frame to frame"""
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
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    path = os.path.join(SRC, FILES[L])
    still_cut = None
    if L in ERASE or L in BLANK or L in STILLS:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        if L in STILLS:                                           # the standing still: the figure in its box (specks under 6 px dropped)
            m = SR.figure_mask(img.astype(np.int32))
            keep = np.zeros_like(m)
            for sx0, sy0, sx1, sy1 in STILLS[L]:
                keep[sy0:sy1, sx0:sx1] = m[sy0:sy1, sx0:sx1]
            klab, kn = ndimage.label(keep, structure=np.ones((3, 3)))
            ksz = ndimage.sum(keep, klab, range(1, kn + 1))
            keep = np.isin(klab, 1 + np.where(ksz >= 6)[0])
            im, box = SR.rgba_crop(img.astype(np.int32), keep)
            still_cut = [('still', im, box)]
            img[keep] = navy
        for x0, y0, x1, y1 in ERASE.get(L, ()):
            box = img[y0:y1, x0:x1].astype(int)
            glyph = (box.mean(-1) > 140) | ((box[..., 2] >= box[..., 0]) & (box.mean(-1) > 50))
            img[y0:y1, x0:x1][glyph] = navy
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'greyfang-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if still_cut:
        out['still'] = still_cut
    if L == 2 and 'fall' in out:                                  # his `headless` row: the side Fall with the head taken away (below)
        out['headless'] = [(nm, headless(im, box, HEADLESS[i]), box) for i, (nm, im, box) in enumerate(out['fall'])]
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'greyfang'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
        for r in rows:                                            # a frame whose box reaches its band's edge may have been clipped there
            for nm, im, box in out.get(r[0], ()):
                if r[0] != 'turn' and (box[1] + 2 <= r[1][1] + 1 or box[3] - 2 >= r[1][3] - 1):
                    print('  near the band edge: sheet %d %s %s box %s band y %d-%d' % (L, r[0], nm, box, r[1][1], r[1][3]))
    return out


def figure_mean(im):
    """mean RGB over a cut frame's figure"""
    a = np.asarray(im)
    return a[a[..., 3] > 0][:, :3].mean(0)


def scales(c):
    """K per sheet (sheet px a game px), the turnaround meeting sheet 1 by its Right still against the idle"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    idle = med(c[1]['idle'])
    k1 = med(c[1]['idle'], 1) / HEIGHT
    guards = [body(c[2][r][i][1])[0] for r, i in GUARD]
    k2 = k1 * float(np.median(guards)) / idle
    # the turnaround by height: its Front still stands STILL_H (the seat, 10-08: matched by area to the idle it stood 84 against the crouch's
    # 63 -- right by his feet and fletching, but he crouches deep in every row and stands upright in the stills, and a turn popped; Griz's
    # earth elemental, 10-08: "bringing the front and back views down to the size of the rest ... so long as the difference is less obvious
    # it's a win"; 70 is the made gnoll's side-to-front, 64 to 71)
    kt = body(c[1]['turn'][0][1])[1] / STILL_H
    print('  K: sheet 1 %.3f, sheet 2 %.3f (its guards %s against sheet 1\'s idle %.1f), turnaround %.3f; the side idle %d px (sheet), front still %.0f px, back still %.0f px'
          % (k1, k2, ' '.join('%.1f' % g for g in guards), idle, kt, HEIGHT,
             body(c[1]['turn'][0][1])[1] / kt, body(c[1]['turn'][2][1])[1] / kt))
    K = {1: k1, 2: k2, 't': kt}
    for L in ISO.values():                                    # each isometric view meets sheet 2 by height: the same rows' first frames, the guard
        r = [body(c[L][row][0][1])[1] / body(c[2][row][0][1])[1] for row in ISO_GUARD]
        K[L] = k2 * float(np.median(r))
        print('  K: iso sheet %d %.3f (its guards against sheet 2\'s by height %s)' % (L, K[L], ' '.join('%.2f' % x for x in r)))
    return K


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    for L in (1, 2):
        print('  tone sheet %d stills:' % L, ' '.join('%s %s' % (nm, np.round(figure_mean(im), 1).tolist()) for nm, im, _ in c[L]['turn']))
    rowmean = lambda L, rows: np.round(np.mean([figure_mean(toned(im, TONE[L]) if L in TONE else im) for r in rows for _, im, _ in c[L][r]], axis=0), 1).tolist()
    print('  bow-in-hand rows, sheet 1 idle+walk %s against sheet 2 volley+backstep (toned) %s' % (rowmean(1, ['idle', 'walk']), rowmean(2, ['volley', 'backstep'])))
    for L in ISO.values():
        print('  tone iso sheet %d, its seven rows %s against sheet 2\'s same rows (toned) %s' % (L, rowmean(L, ISO_ROWS.values()), rowmean(2, ISO_ROWS.values())))
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    def still(name):
        for nm, im, box in c[1]['turn']:
            if nm == name:
                a = game_frame(im, K['t'])
                return a, core_x(a), 0
    def istill(L):                                            # an isometric sheet's standing still, at its sheet's scale
        a = game_frame(c[L]['still'][0][1], K[L], TONE.get(L))
        return a, core_x(a), 0
    MIRROR = (1, 2, 3)                                        # the side rows face right: SW, W and NW take them mirrored
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        if eng in REVERSED:
            side = side[::-1]
        per = []                                              # per facing: (frames, mirrored?)
        for f in range(8):
            iso = ISO.get(f, ISO_NEAR.get(f))
            if f in STILL.get(eng, {}):
                per.append(([still(STILL[eng][f])] * len(side), False))
            elif eng == 'idle' and f in ISO:                  # a diagonal stands as its view's still (the bottom-left has none: the bottom-right's, mirrored)
                per.append(([istill(ISO[f])] * len(side), False) if ISO[f] in STILLS else ([istill(ISO[7])] * len(side), True))
            elif eng in ISO_ROWS and iso:                     # a diagonal (and S, N, the nearer view) plays its own view's row, as drawn
                fs = frames_of(iso, ISO_ROWS[eng])
                per.append((fs[::-1] if eng in REVERSED else fs, False))
            else:
                per.append((side, f in MIRROR))
        src[eng] = per
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs, _ in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, (fs, mirrored) in enumerate(per):
            row = []
            for a, cx, up in fs:
                if mirrored:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'greyfang_p1'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    s0 = frames['idle'][0][0]                       # (the panel's portrait centres on his face: his front still's first opaque row, twelve px down to the eyes -- ui.js, the twin's way)
    meta['face'] = int(AY - np.where(s0[..., 3].any(axis=1))[0][0] - 12)
    meta['source'] = ('generated by Griz (2026-10-08: two GPT sheets -- the body and its rows, then the extra moves -- and four isometric sheets of '
                      'the extra moves, one a diagonal), cut by tools/greyfang-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    side = [h(fr) for fr in frames['idle'][6]]
    print('  side idle (E) opaque height with outline: %s px (Talmok 63); S still %d px, N still %d px'
          % ([int(r[-1] - r[0] + 1) for r in side], h(frames['idle'][0][0])[-1] - h(frames['idle'][0][0])[0] + 1,
             h(frames['idle'][4][0])[-1] - h(frames['idle'][4][0])[0] + 1))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'greyfang')
        lineup(frames, os.path.join(d, 'lineup.png'))
        strips(frames, meta, d)


def art_frame(name, anim, facing, i):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(frames, path):
    """Talmok, the hobgoblin, the mirror-eyed gnoll and GreyFang (E, S, N), at 4x on a grey floor (his size, for Griz's eye)"""
    figs = [art_frame('talmok_p1', 'idle', 6, 0), art_frame('hobgoblin_p2', 'idle', 6, 0), art_frame('mirrorgnoll_p1', 'idle', 6, 0),
            art_frame('greyfang_p1', 'idle', 6, 0), art_frame('greyfang_p1', 'idle', 0, 0), art_frame('greyfang_p1', 'idle', 4, 0)]
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


def strips(frames, meta, d, z=3):
    """a contact strip a row (the E facing, a grey floor, the frame's number, the release frame ringed), and every facing of the idle"""
    for eng, per in frames.items():
        fs = per[6]
        fw = meta['anims'][eng]['fw']
        W, H = fw * len(fs) + 4 * (len(fs) + 1), FH
        cv = Image.new('RGBA', (W, H), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for i, fr in enumerate(fs):
            x = 4 + i * (fw + 4)
            cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (x, 0))
            dr.line([(x, AY + 1), (x + fw, AY + 1)], fill=(110, 114, 110, 255))
            dr.text((x + 2, 2), str(i + 1), fill=(255, 255, 255, 255))
            if meta['anims'][eng].get('release') == i:
                dr.rectangle([x, 0, x + fw - 1, H - 1], outline=(255, 90, 90, 255))
        cv.resize((W * z, H * z), Image.NEAREST).save(os.path.join(d, 'row-%s.png' % eng))
    for eng in sorted(set(ISO_ROWS) | {'idle'}):                # every facing of a row with its isometric views: E, then SE, SW, NW, NE, then S and N
        fw, order = meta['anims'][eng]['fw'], [6, 7, 1, 3, 5, 0, 4]
        n = len(frames[eng][6])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), FH * len(order)), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for j, f in enumerate(order):
            for i, fr in enumerate(frames[eng][f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (fw + 4), j * FH))
            dr.text((2, j * FH + 2), ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'][f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % eng))
    fw = meta['anims']['idle']['fw']
    cv = Image.new('RGBA', (fw * 16 + 40, FH), (70, 74, 70, 255))
    for f in range(8):
        for i in range(2):
            cv.alpha_composite(Image.fromarray(frames['idle'][f][i], 'RGBA'), (4 + (f * 2 + i) * (fw + 2), 0))
    cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'idle-facings.png'))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
