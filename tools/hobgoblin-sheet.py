"""DEEP16 pipeline 2 (generated art): Griz's eight GPT sheets for the hobgoblin and the hobgoblin sergeant -> hobgoblin_p2 and hobsergeant_p2.

    python tools/hobgoblin-sheet.py            (writes deep16/art/hobgoblin_p2 and hobsergeant_p2, .png/.json)
    python tools/hobgoblin-sheet.py check      (also the cut overlays, dev/visions/hobgoblin/cut-<look>-<n>.png)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Hobgoblin1..4.png and HobSergeant1..4.png -- Griz,
2026-10-07, from the eight pastes in deep16-art-in-hand.md "The hobgoblin and the hobgoblin sergeant" (his: "copy pasta for 3 and 4 please",
then "Hobgoblin and hobsergeant sheets are in _src"). Each look's sheet 1 is the side rows with its portrait and turnaround (the turnaround cut
for the scale only), sheet 2 its tricks side-on (Martial Advantage, Climb), sheet 3 from the front, sheet 4 from behind. Each is cut by its
own rows (tools/sheetrows.py); the boxes below were read off the sheets, and every row's frames are placed by its number labels' x, read off
them by a probe (the labels' own detection takes a sword's steel for a number on these sheets). Every row's number strip is lettering.

The rows face RIGHT: facings NE, E and SE take them as drawn, SW, W and NW mirrored; S takes sheet 3's rows, N sheet 4's (the fall and the
prone stay side-on; the climb has no front). The scale is the goblin's way (tools/goblin-sheet.py), measured here as it cuts: each row's body
by its area (holes filled) against the turnaround's matching view, so the front, the back and the tricks meet the side rows at one size; the
front idle is set to stand about 50 px (the hobgoblin, "as tall as a man") and 56 (the sergeant, "taller and heavier", with its crest).
New rows: `longsword` (and `attack`, the fallback), the sergeant's `longsword2` (battle.js plays an attack's second use in a turn on its
numbered row), the hobgoblin's `longbow` (its `release` frame times the shot), `martial` (Martial Advantage: the drilled lunge, js/battle.js).
ART-25 (10-15): the art desk drew the hobgoblin's missing views (RULED 10-14, five drawn views: S, SE, E, NE, N; SE mirrors to SW, E to W,
NE to NW), six pages of 104 in deep16/_src/hobgoblin/ART-25/ (its ART-25-MANIFEST.md), each cut by its own row and number labels (cut25):
    H1P1  ART-25_HEAD-1_PAGE-1.png  SE: Idle 6, Walk 8, Longsword 6, Longbow 6
    H1P2  ART-25_HEAD-1_PAGE-2.png  SE: Martial Advantage 6, Flinch 4, Fall 6, Prone 2
    H2P1  ART-25_HEAD-2_PAGE-1.png  NE: the rows of H1P1
    H2P2  ART-25_HEAD-2_PAGE-2.png  NE: the rows of H1P2
    H3P1  ART-25_HEAD-3_PAGE-1.png  S:  Fall 6, Prone 2
    H5P1  ART-25_HEAD-5_PAGE-1.png  N:  Fall 6, Prone 2
Longsword plays `longsword` and `attack`, Longbow `longbow` (its release frame 5, index 4, as the side's), Martial Advantage `martial`, Fall
`hurt` (from frame 1's feet: the body lying nearer the eye reaches lower), Prone `prone` (played backwards, as the side's: it lies at Prone 1
and gets up through Prone 2). E and W keep sheet 1's rows, S and N keep sheets 3 and 4's for every row but the fall and the prone, and the
climb stays as it was (no climb was drawn). Each page scaled by area against the views beside it and toned in HSV to the side rows (scales25).
The sergeant's sheet is untouched (its own missing views are ART-26).
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

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'Hobgoblin1.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per look, per sheet: the file, text boxes (a blob wholly inside one is lettering: the row names, the portrait, a stray dropped on purpose;
# every row's number strip is added below), and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
LOOKS = {
  'hobgoblin': {
    1: dict(file='Hobgoblin1.png', text=[(0, 0, 282, 236), (0, 236, 185, 1055),
                                         (648, 872, 738, 902)],          # fall 3's arrow in flight (a stray of the generator's: no arrow was shot)
            rows=[('turn', (300, 5, 920, 186), (186, 212), TURN, [373, 539, 698, 858]),
                  ('idle', (185, 212, 1491, 360), (338, 360), NUM(6), [257, 381, 507, 638, 765, 888]),
                  ('walk', (185, 349, 1491, 494), (470, 494), NUM(8), [259, 389, 520, 653, 776, 904, 1026, 1156]),
                  ('longsword', (185, 482, 1491, 631), (609, 631), NUM(6), [248, 387, 534, 681, 834, 973]),
                  ('longbow', (185, 620, 1491, 771), (747, 771), NUM(6), [257, 397, 547, 696, 851, 1000]),
                  ('flinch', (185, 759, 1491, 883), (861, 883), NUM(4), [254, 400, 516, 639]),
                  ('fall', (185, 872, 1491, 992), (961, 992), NUM(6), [271, 407, 606, 885, 1111, 1357]),
                  ('prone', (185, 976, 1491, 1055), (1032, 1055), NUM(2), [283, 459])]),
    2: dict(file='Hobgoblin2.png', text=[(0, 130, 420, 196), (0, 568, 160, 625)],
            rows=[('martial', (0, 196, 1448, 506), (474, 506), NUM(6), [111, 321, 564, 827, 1117, 1333]),
                  ('climb', (0, 506, 1448, 990), (955, 990), NUM(6), [111, 342, 601, 834, 1089, 1324])]),
    3: dict(file='Hobgoblin3.png', text=[(0, 15, 115, 60), (0, 182, 125, 228), (0, 368, 215, 415), (0, 550, 180, 602), (0, 728, 335, 772),
                                         (0, 908, 140, 956)],
            rows=[('idle', (0, 0, 1448, 179), (152, 179), NUM(6), [343, 509, 688, 860, 1038, 1210]),
                  ('walk', (0, 166, 1448, 370), (343, 370), NUM(8), [254, 414, 571, 720, 882, 1024, 1177, 1327]),
                  ('longsword', (0, 357, 1448, 552), (524, 552), NUM(6), [339, 506, 674, 855, 1045, 1217]),
                  ('longbow', (0, 538, 1448, 746), (708, 746), NUM(6), [303, 490, 684, 878, 1075, 1283]),
                  ('martial', (0, 727, 1448, 921), (892, 921), NUM(6), [376, 525, 693, 861, 1078, 1230]),
                  ('flinch', (0, 907, 1448, 1079), (1053, 1079), NUM(4), [474, 659, 840, 1016])]),
    4: dict(file='Hobgoblin4.png', text=[(0, 62, 105, 108), (0, 208, 115, 258), (0, 362, 195, 412), (0, 520, 165, 566), (0, 662, 288, 712),
                                         (0, 806, 125, 852), (0, 954, 115, 1000)],
            rows=[('idle', (0, 0, 1448, 159), (138, 159), NUM(6), [280, 446, 618, 788, 959, 1129]),
                  ('walk', (0, 148, 1448, 318), (297, 318), NUM(8), [273, 423, 569, 708, 863, 1008, 1151, 1304]),
                  ('longsword', (0, 307, 1448, 471), (450, 471), NUM(6), [281, 453, 623, 792, 983, 1173]),
                  ('longbow', (0, 460, 1448, 632), (611, 632), NUM(6), [277, 464, 663, 849, 1070, 1258]),
                  ('martial', (0, 621, 1448, 775), (754, 775), NUM(6), [366, 550, 737, 961, 1149, 1316]),
                  ('flinch', (0, 764, 1448, 909), (888, 909), NUM(4), [288, 483, 649, 835]),
                  ('climb', (0, 893, 1448, 1076), (1055, 1076), NUM(6), [274, 461, 662, 848, 1048, 1262])]),
  },
  'sergeant': {
    1: dict(file='HobSergeant1.png', text=[(0, 0, 362, 264), (0, 264, 172, 1086)],
            rows=[('turn', (380, 42, 1030, 236), (10, 42), TURN, [478, 638, 795, 944]),
                  ('idle', (0, 236, 1448, 378), (358, 378), NUM(6), [242, 381, 527, 662, 802, 939]),
                  ('walk', (0, 368, 1448, 512), (492, 512), NUM(8), [225, 386, 545, 705, 863, 1029, 1184, 1338]),
                  ('longsword', (0, 502, 1448, 648), (627, 648), NUM(6), [247, 412, 557, 688, 820, 960]),
                  ('longsword2', (0, 637, 1448, 783), (763, 783), NUM(6), [225, 396, 553, 685, 820, 953]),
                  ('flinch', (0, 773, 1448, 906), (885, 906), NUM(4), [225, 363, 502, 631]),
                  ('fall', (0, 896, 1448, 1007), (986, 1007), NUM(6), [242, 390, 545, 721, 891, 1074]),
                  ('prone', (0, 996, 1448, 1086), (1065, 1086), NUM(2), [225, 416])]),
    2: dict(file='HobSergeant2.png', text=[(0, 300, 172, 405), (0, 745, 130, 800)],
            rows=[('martial', (0, 200, 1448, 506), (470, 506), NUM(6), [241, 434, 651, 886, 1120, 1327]),
                  ('climb', (0, 540, 1448, 935), (900, 935), NUM(6), [254, 464, 673, 881, 1116, 1327])]),
    3: dict(file='HobSergeant3.png', text=[(0, 82, 80, 122), (0, 278, 100, 318), (0, 480, 175, 525), (0, 660, 192, 703), (0, 825, 245, 870),
                                           (0, 972, 110, 1012)],
            rows=[('idle', (0, 0, 1448, 212), (189, 212), NUM(6), [287, 464, 643, 822, 1003, 1180]),
                  ('walk', (0, 200, 1448, 408), (386, 408), NUM(8), [260, 417, 570, 723, 876, 1028, 1184, 1332]),
                  ('longsword', (0, 397, 1448, 603), (579, 603), NUM(6), [290, 463, 640, 810, 986, 1158]),
                  ('longsword2', (0, 591, 1448, 781), (758, 781), NUM(6), [285, 468, 644, 822, 1004, 1185]),
                  ('martial', (0, 770, 1448, 949), (924, 949), NUM(6), [311, 478, 651, 831, 1009, 1188]),
                  ('flinch', (0, 936, 1448, 1083), (1061, 1083), NUM(4), [255, 425, 586, 732])]),
    4: dict(file='HobSergeant4.png', text=[(0, 78, 80, 115), (0, 240, 95, 280), (0, 398, 170, 450), (0, 552, 190, 600), (0, 697, 240, 745),
                                           (0, 822, 110, 868), (0, 962, 100, 1000)],
            rows=[('idle', (0, 0, 1448, 175), (152, 175), NUM(6), [261, 451, 644, 823, 1005, 1183]),
                  ('walk', (0, 163, 1448, 346), (323, 346), NUM(8), [235, 385, 540, 697, 862, 1023, 1178, 1331]),
                  ('longsword', (0, 334, 1448, 509), (486, 509), NUM(6), [272, 438, 624, 801, 989, 1157]),
                  ('longsword2', (0, 497, 1448, 658), (636, 658), NUM(6), [267, 451, 630, 809, 1000, 1167]),
                  ('martial', (0, 646, 1448, 799), (777, 799), NUM(6), [302, 465, 645, 839, 1035, 1215]),
                  ('flinch', (0, 788, 1448, 930), (908, 930), NUM(4), [271, 448, 619, 788]),
                  ('climb', (0, 910, 1448, 1083), (1061, 1083), NUM(6), [271, 455, 636, 807, 992, 1161])]),
  },
}
# a row's band runs from the middle of the number strip above it to the middle of its own (a raised sword in the next row stays out, and
# the feet that dip into a strip stay in); SPLIT gives the line between a row and the one above by hand where the two come closer than that
SPLIT = {('hobgoblin', 4, 'climb'): 889, ('sergeant', 4, 'climb'): 909,   # the back's flinch feet and the climb's raised hands
         ('sergeant', 3, 'flinch'): 930}                                    # the front's martial feet and flinch 1's crest
# loose bits by hand: (look, sheet) -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)]
FIX = {('hobgoblin', 1): {'fall': [((684, 925, 790, 960), '3'), ((1172, 925, 1262, 960), '5')]}}   # the dropped swords, each its own frame's
CUT = {('sergeant', 1): {'longsword': [[(636, 584), (636, 627)]]},    # longsword 3's blade, at longsword 4's cape edge
       ('sergeant', 3): {'longsword2': [[(765, 690), (765, 724)]]}}   # longsword 2's frame 3 blade tip, at frame 4's cape
TOUCH_OK = {('hobgoblin', 1): {'fall'}, ('sergeant', 1): {'longsword'}, ('sergeant', 3): {'longsword2'}}
# painted navy before the cut: a label touching a figure (so it is not wholly inside its strip)
ERASE = {('hobgoblin', 1): [(249, 862, 263, 880)]}          # the flinch row's "1", a pixel over fall 1's helm
# a blade drawn over the next frame: its steel (bright, grey) in the box filled from the nearest pixel that is not, before the cut
UNBLADE = {('sergeant', 1): [(637, 586, 664, 622)],         # longsword 3's tip over longsword 4's boot (the blade ends at the cape's edge)
           ('sergeant', 3): [(766, 698, 782, 720)]}         # longsword 2's frame 3 tip on frame 4's cape
# the engine's rows: side (sheet 1, or 2 for the tricks), and which have a front (sheet 3, facing S) and a back (sheet 4, facing N)
ENGINE = {
  'hobgoblin_p2': dict(look='hobgoblin', height=50, rows={
      'idle': 1, 'walk': 1, 'longsword': 1, 'attack': (1, 'longsword'), 'longbow': 1, 'martial': 2, 'climb': 2, 'flinch': 1,
      'hurt': (1, 'fall'), 'prone': 1},
      S=['idle', 'walk', 'longsword', 'longbow', 'martial', 'flinch'], N=['idle', 'walk', 'longsword', 'longbow', 'martial', 'flinch', 'climb'],
      heads=True),                                         # ART-25's pages give its SE, NE, and S and N fall and prone (HEADS below)
  'hobsergeant_p2': dict(look='sergeant', height=56, rows={
      'idle': 1, 'walk': 1, 'longsword': 1, 'attack': (1, 'longsword'), 'longsword2': 1, 'martial': 2, 'climb': 2, 'flinch': 1,
      'hurt': (1, 'fall'), 'prone': 1},
      S=['idle', 'walk', 'longsword', 'longsword2', 'martial', 'flinch'], N=['idle', 'walk', 'longsword', 'longsword2', 'martial', 'flinch', 'climb']),
}
RELEASE = {'longbow': 4}                                     # the frame the arrow leaves on (frame 5: the string hand open), js/battle.js times the shot by it
FH, AY = 112, 100

# ART-25 (10-15): the art desk's six pages for the hobgoblin, deep16/_src/hobgoblin/ART-25/ (its ART-25-MANIFEST.md; the desk's papers in
# _src/art-desk/received-2026-10-14-ART-25/). Per page: the row names' boxes (lettering), and its rows -- (the page's row, its number strip
# y0 y1, the numbers' x), read off the page (the white glyphs' columns). The names are the old sheets' (Martial Advantage `martial`, Fall `fall`).
ART25 = os.path.join(SRC, 'hobgoblin', 'ART-25')
PAGES = {
  'H1P1': dict(file='ART-25_HEAD-1_PAGE-1.png',                                                     # SE: Idle 6, Walk 8, Longsword 6, Longbow 6
               names=[(12, 141, 103, 185), (12, 376, 113, 420), (12, 631, 194, 675), (12, 883, 165, 927)],
               rows=[('idle', (222, 240), [242, 428, 611, 801, 987, 1175]),
                     ('walk', (469, 488), [217, 369, 536, 694, 853, 1019, 1181, 1349]),
                     ('longsword', (724, 743), [263, 459, 658, 871, 1082, 1275]),
                     ('longbow', (975, 997), [268, 473, 683, 902, 1122, 1343])]),
  'H1P2': dict(file='ART-25_HEAD-1_PAGE-2.png',                                                     # SE: Martial Advantage 6, Flinch 4, Fall 6, Prone 2
               names=[(14, 103, 198, 193), (14, 373, 145, 437), (14, 593, 105, 643), (14, 811, 146, 860)],
               rows=[('martial', (239, 261), [284, 479, 693, 925, 1173, 1404]),
                     ('flinch', (481, 502), [284, 512, 707, 922]),
                     ('fall', (704, 734), [284, 509, 722, 936, 1205, 1470]),
                     ('prone', (895, 915), [292, 555])]),
  'H2P1': dict(file='ART-25_HEAD-2_PAGE-1.png',                                                     # NE: the rows of H1P1
               names=[(12, 144, 100, 188), (12, 382, 112, 427), (12, 627, 191, 671), (12, 849, 166, 894)],
               rows=[('idle', (219, 238), [243, 451, 654, 866, 1070, 1286]),
                     ('walk', (461, 480), [238, 391, 545, 699, 870, 1025, 1178, 1339]),
                     ('longsword', (703, 722), [244, 451, 651, 869, 1078, 1291]),
                     ('longbow', (963, 982), [267, 457, 666, 880, 1098, 1338])]),
  'H2P2': dict(file='ART-25_HEAD-2_PAGE-2.png',                                                     # NE: the rows of H1P2
               names=[(14, 153, 181, 230), (14, 391, 129, 437), (14, 631, 88, 677), (14, 868, 129, 915)],
               rows=[('martial', (246, 266), [263, 466, 684, 906, 1122, 1346]),
                     ('flinch', (488, 510), [262, 466, 684, 906]),
                     ('fall', (742, 764), [229, 444, 647, 862, 1096, 1343]),
                     ('prone', (965, 987), [254, 496])]),
  'H3P1': dict(file='ART-25_HEAD-3_PAGE-1.png',                                                     # S: Fall 6, Prone 2
               names=[(21, 213, 165, 285), (21, 511, 218, 584)],
               rows=[('fall', (374, 405), [332, 620, 894, 1212, 1555, 1897]),
                     ('prone', (646, 674), [407, 763])]),
  'H5P1': dict(file='ART-25_HEAD-5_PAGE-1.png',                                                     # N: Fall 6, Prone 2
               names=[(15, 281, 112, 336), (15, 641, 152, 695)],
               rows=[('fall', (435, 461), [259, 524, 773, 1018, 1296, 1597]),
                     ('prone', (764, 789), [326, 632])]),
}
# a view's pages (a view's row from its page; the S and N pages give only the fall and the prone, the rest of S and N stay sheets 3 and 4's)
HEADS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1',), 'N': ('H5P1',)}
VIEW = {0: 'S', 1: 'SE', 3: 'NE', 4: 'N', 5: 'NE', 7: 'SE'}  # facing (S SW W NW N NE E SE) -> the drawn view it shows (SW, NW mirrored)
FLOOR = ('fall',)                                            # the page's fall starts standing: its ground is frame 1's feet (a body lying nearer
                                                             # the eye reaches lower on the page); every other row stands on its lowest point


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX if k >= 1 else Image.LANCZOS)


def core_x(a):
    """x of the body's thick middle (torso and head; the blade, the bow and the limbs are thin), the steadiest thing frame to frame"""
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


def cut(look, L, check=False):
    s = LOOKS[look][L]
    rows, prev = [], None
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((look, L, r[0]), prev)
                if rows and rows[-1][0] != 'turn' and (look, L, r[0]) in SPLIT:
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(s, rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows],     # (the strip handed on is keyed by the band's top: xs by hand)
                text=s['text'] + [(r[1][0], r[2][0], r[1][2], r[2][1]) for r in s['rows']])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    path = os.path.join(SRC, s['file'])
    if (look, L) in ERASE or (look, L) in UNBLADE:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in ERASE.get((look, L), ()):
            img[y0:y1, x0:x1] = navy
        for x0, y0, x1, y1 in UNBLADE.get((look, L), ()):
            box = img[y0:y1, x0:x1].astype(int)
            steel = (box.max(-1) - box.min(-1) < 45) & (box.mean(-1) > 110)
            _, (iy, ix) = ndimage.distance_transform_edt(steel, return_indices=True)
            img[y0:y1, x0:x1] = box[iy, ix].astype(np.uint8)
        path = os.path.join(tempfile.gettempdir(), 'hobgoblin-sheet-%s-%d.png' % (look, L))
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get((look, L)), cuts=CUT.get((look, L)),
                           touch_ok=TOUCH_OK.get((look, L), ()), overlay=over, tag='%s %d' % (look, L))
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'hobgoblin'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%s-%d.png' % (look, L)))
    return out


def cut25(L, check=False):
    """sheetrows over one ART-25 page -> {row: [(name, RGBA image, box)]}, the frames split by the numbers' x's as read, every number and row
    name dropped as text. The rows crowd (H2P1's Longsword 2 raises its sword to the Walk numbers, H2P2's Fall 1 and 2 theirs to the Flinch's),
    so a band is no fence: each blob goes to the row its centre lies in (above that row's numbers, below the row above's), and each row is cut
    from a strip of the page with every other row's blobs painted the navy (tools/mirrorgnoll-sheet.py cut31, the Harbinger's way)."""
    import io
    s = PAGES[L]
    a = np.asarray(Image.open(os.path.join(ART25, s['file'])).convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    text, hand = [tuple(b) for b in s['names']], {}
    for row, (sy0, sy1), xs in s['rows']:
        text += [(int(x) - 20, sy0 - 5, int(x) + 20, sy1 + 6) for x in xs]   # (a number's soft drop shadow runs past its glyph)
    m = SR.figure_mask(a)
    SR.drop_text(m, text)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cy = np.array([c[0] for c in ndimage.center_of_mass(m, lab, range(1, n + 1))])
    owner = np.searchsorted([sy1 for _, (_, sy1), _ in s['rows']], cy)      # a blob's row: the first whose numbers lie below its centre
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    orig = SR.label_xs
    SR.label_xs = lambda a_, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a_, x0, x1, y0, y1)
    out, over = {}, (a * 0.25).astype(np.uint8) if check else None
    try:
        for k, (row, (sy0, sy1), xs) in enumerate(s['rows']):
            mine = np.isin(lab, 1 + np.where(owner == k)[0])
            b = a.copy()
            b[m & ~mine] = navy
            ys = np.where(mine.any(1))[0]
            Y0, Y1 = max(0, min(ys[0], sy0) - 8), min(H, max(ys[-1], sy1) + 8)
            sh = lambda bx: (bx[0], bx[1] - Y0, bx[2], bx[3] - Y0)
            buf = io.BytesIO(); Image.fromarray(b[Y0:Y1].astype(np.uint8)).save(buf, 'PNG'); buf.seek(0)
            hand[(0, sy0 - Y0)] = xs
            spec = dict(text=[sh(t) for t in text], rows=[(row, (0, 0, W, Y1 - Y0), (sy0 - Y0, sy1 - Y0), NUM(len(xs)))])
            o = [] if check else None
            got = SR.cut_sheet(buf, spec, overlay=o, tag=L)
            out.update({r: [(nm, im, (bx[0], bx[1] + Y0, bx[2], bx[3] + Y0)) for nm, im, bx in frs] for r, frs in got.items()})
            if check:
                over[Y0:Y1][mine[Y0:Y1]] = np.asarray(o[0])[mine[Y0:Y1]]
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'hobgoblin'); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).save(os.path.join(d, 'cut25-%s.png' % L))
    return out


def scales(look, c, height):
    """K per sheet (sheet px a game px): the front idle stands `height`; the rest by area against the turnaround (the goblin's way)"""
    med = lambda frs: float(np.median([body(im)[0] for _, im, _ in frs]))
    turn = {nm: body(im)[0] for nm, im, _ in c[1]['turn']}
    r1 = med(c[1]['idle']) / turn['right']                   # the side idle to the turnaround's Right (it hunches on guard)
    r3 = med(c[3]['idle']) / turn['front']                   # sheet 3's front idle (at sheet 3's scale) to the Front
    r4 = med(c[4]['idle']) / turn['back']
    r2 = body(c[2]['martial'][-1][1])[0] / med(c[1]['idle'])   # the tricks' last guard (Martial Advantage 6, back in line) to the side idle
    k3 = float(np.median([body(im)[1] for _, im, _ in c[3]['idle']])) / height
    k1 = k3 * r1 / r3
    K = {1: k1, 2: k1 * r2, 3: k3, 4: k3 * r4 / r3}
    print('  %s: side %.3f front %.3f back %.3f of the turnaround, the tricks %.3f of the side; K %s' %
          (look, r1, r3, r4, r2, ', '.join('%d %.2f' % kv for kv in sorted(K.items()))))
    return K


def hsv_median(ims):
    """the medians of a cut's coloured pixels (saturation over 0.2): hue (degrees, the reds over 300 read below 0), saturation, value"""
    px = []
    for im in ims:
        a = np.asarray(im).astype(float)
        rgb = a[a[..., 3] > 0][:, :3] / 255.0
        mx, mn = rgb.max(1), rgb.min(1)
        d = np.maximum(mx - mn, 1e-6)
        r, g, b = rgb.T
        h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
        s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        k = s > 0.2
        px.append(np.stack([np.where(h[k] > 300, h[k] - 360, h[k]), s[k], mx[k]], 1))
    p = np.concatenate(px)
    return tuple(float(np.median(p[:, i])) for i in range(3))


def toned(im, t):
    """an RGBA cut in HSV: its hue turned t[0] degrees, its saturation times t[1], its value times t[2] (tools/hyena-sheet.py's)"""
    a = np.asarray(im).astype(float)
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = (np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60 + t[0]) % 360
    s = np.clip(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0) * t[1], 0, 1)
    v = np.clip(mx * t[2], 0, 1)
    cc = v * s
    x = cc * (1 - np.abs((h / 60) % 2 - 1))
    sec = (h // 60).astype(int) % 6
    z = np.zeros_like(cc)
    out = np.select([sec[..., None] == k for k in range(6)],
                    [np.stack(p, -1) for p in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))]) + (v - cc)[..., None]
    a[..., :3] = np.clip(out * 255, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')


def scales25(c, K, p):
    """ART-25's K per page (page px a game px) and its tone. No turnaround on the pages: each page's standing hobgoblin by the square root of its
    filled area (the house's way since the hyena: height lies -- the page 2s' guard crouches lower than page 1's idle, the same height and a
    bigger body) against the views beside it at game size: the SE idle to the side idle's and the front idle's geometric mean, the NE idle to
    the side's and the back's; a page 2 by its Martial Advantage 1 and Flinch 4 (both the guard) against its page 1's idle; the S page by its
    Fall 1 (standing, the guard) against the front idle and the front's Flinch 1 (the mean), the N page the same against the back's. The tone:
    each page's hue, saturation and value medians turned to the side rows' (sheet 1's idle, walk and longsword)."""
    med = lambda frs: float(np.median([body(im)[0] for _, im, _ in frs]))
    sq = lambda im: body(im)[0]
    g = {L: med(c[L]['idle']) / K[L] for L in (1, 3, 4)}                  # the idles' sqrt area at game size: side, front, back
    gf = {L: sq(c[L]['flinch'][0][1]) / K[L] for L in (3, 4)}               # the front's and back's Flinch 1
    k = {'H1P1': med(p['H1P1']['idle']) / np.sqrt(g[1] * g[3]), 'H2P1': med(p['H2P1']['idle']) / np.sqrt(g[1] * g[4])}
    for L2, L1 in (('H1P2', 'H1P1'), ('H2P2', 'H2P1')):
        k[L2] = k[L1] * np.mean([sq(p[L2]['martial'][0][1]), sq(p[L2]['flinch'][3][1])]) / med(p[L1]['idle'])
    for L, F in (('H3P1', 3), ('H5P1', 4)):
        k[L] = sq(p[L]['fall'][0][1]) * np.mean([1 / g[F], 1 / gf[F]])
    ref = hsv_median([im for r in ('idle', 'walk', 'longsword') for _, im, _ in c[1][r]])
    tone = {}
    for L in PAGES:
        h = hsv_median([im for r in p[L] for _, im, _ in p[L][r]])
        tone[L] = (ref[0] - h[0], ref[1] / h[1], ref[2] / h[2])
        print('  ART-25 %s: K %.2f, tone %.1f / %.3f / %.3f from %.1f / %.3f / %.3f' % ((L, k[L]) + tone[L] + h))
    print('  (the side rows %.1f / %.3f / %.3f; the idles at game size, sqrt area: side %.1f, front %.1f, back %.1f)' % (ref + (g[1], g[3], g[4])))
    return k, tone


def main(check=False):
    for name, E in ENGINE.items():
        look = E['look']
        c = {L: cut(look, L, check) for L in LOOKS[look]}
        K = scales(look, c, E['height'])
        tone = {}
        if E.get('heads'):                                   # ART-25's pages, the hobgoblin's (the sergeant's ART-26 waits)
            p = {L: cut25(L, check) for L in PAGES}
            k25, tone = scales25(c, K, p)
            c.update(p); K.update(k25)
        small = {}
        def frames_of(L, row):
            if (L, row) not in small:
                frs = c[L][row]
                floor = frs[0][2][3] if L in PAGES and row in FLOOR else max(b[3] for _, _, b in frs)
                out = []
                for nm, im, box in frs:
                    a = pix.pixelate(game_size(toned(im, tone[L]) if L in tone else im, K[L]), 1, do_lift=False)
                    out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
                if row == 'prone':
                    out = out[::-1]                          # pushing up, then lying: it lies at its last frame and gets up by playing it backwards
                small[(L, row)] = out
            return small[(L, row)]
        src = {}
        for eng, by in E['rows'].items():
            L, row = by if isinstance(by, tuple) else (by, eng)
            per = []
            for f in range(8):                               # facings S SW W NW N NE E SE (deep16/js/sprites.js S.FACINGS)
                pg = [P for P in (HEADS.get(VIEW.get(f), ()) if E.get('heads') else ()) if row in c[P]]   # (a later page's row replaces)
                per.append(frames_of(pg[-1], row) if pg else frames_of(3, row) if f == 0 and row in E['S'] else
                           frames_of(4, row) if f == 4 and row in E['N'] else frames_of(L, row))
            src[eng] = per
            counts = {len(s) for s in src[eng]}
            if len(counts) > 1:
                raise SystemExit('%s %s: frame counts differ by facing %s' % (name, eng, sorted(counts)))
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
                        lost.append('%s %s facing %d' % (name, eng, f))
                    row.append(fr)
                frames[eng].append(row)
        if lost:
            raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
        pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
        meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
        meta = json.load(open(meta_p))
        for row, k in RELEASE.items():
            if row in meta['anims']:
                meta['anims'][row]['release'] = k
        meta['source'] = ('generated by Griz (2026-10-07: four GPT sheets -- the side rows, its tricks, from the front, from behind)' +
                          (', and the art desk (2026-10-15, ART-25: the SE and NE views of every row, the front and back of the fall and the prone)'
                           if E.get('heads') else '') + ', cut by tools/hobgoblin-sheet.py')
        json.dump(meta, open(meta_p, 'w'), indent=1)
        print(name + ':', ', '.join('%s %d' % (k, len(v[0])) for k, v in frames.items()))


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(name):
    """dev/visions/hobgoblin/facings-<row>.png: every facing of every row of the sheet as written, S SW W NW N NE E SE top to bottom, 2x on
    a grey floor (the anchor's line drawn under the frames)"""
    from PIL import ImageDraw
    d = os.path.join(ROOT, 'dev', 'visions', 'hobgoblin'); os.makedirs(d, exist_ok=True)
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    sh = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, a in m['anims'].items():
        fw, fh, n = a['fw'], a['fh'], a['frames']
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 20, fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + a['ay'] + 1), (cv.width, f * fh + a['ay'] + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
            for i in range(n):
                cv.alpha_composite(sh.crop((i * fw, a['y'] + f * fh, (i + 1) * fw, a['y'] + (f + 1) * fh)), (20 + 4 + i * (fw + 4), f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    print('  wrote', d)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
    if 'check' in sys.argv[1:]:                              # every facing of every row (the hobgoblin's: ART-25 drew its SE, NE and S/N falls)
        facings('hobgoblin_p2')
