"""DEEP16 pipeline 2 (generated art): Griz's GPT sheets of GreyFang, the grizzled ranger, and the art desk's pages -> greyfang_p1.

    python tools/greyfang-sheet.py            (writes deep16/art/greyfang_p1.png/.json)
    python tools/greyfang-sheet.py check      (also the cut overlays, dev/visions/greyfang/cut-<n>.png, a contact strip of every row and a lineup beside Talmok)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/greyfang/Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png
and Greyfang's extra moves sprite sheet-2.png (a CURLY apostrophe in the second's name) -- Griz, 2026-10-08. GreyFang: a man with a wolf's head,
a grizzled veteran ranger in a torn green cloak, a longbow in his hand, a quiver of arrows on his back, a sword for the close work.
Not ruled how the game plays him -- the seat's (deep16/js/classes.js, data/foes.js); this cuts every row under the names the engine reads.

Each sheet: a portrait, a turnaround (front, right, back, left), then rows facing RIGHT, labelled by number. Sheet 1: idle 2, walk 9, bow 13,
hurt 6, cast 7. Sheet 2: slash 6, volley 8, whirlwind 8, climb 6, prone 2, fall 6, parry 6, backstep 6. Sheet 2's turnaround holds a sword in
its Right still, so the scale and the stills are sheet 1's; sheet 2's is cut only to tone against (its front, back and left carry the same kit).
Engine rows: `idle` <- Idle; `walk` <- Walk; `longbow` <- Bow (the engine plays a row named for the blow, lower-cased, battle.js attack: his
Longbow -- since 10-14 his GreyFang's Bow +1 finds it by its kind, longbow; a blow named Shortbow would find no row and play `attack`); `attack`
<- Slash (a `slash` row too till 10-14, its twin: nothing named a blow so, and the show wanted it twice); `cast` <- Cast; `climb` <- Climb; `flinch` <-
Hurt (a blow that lands and doesn't drop him); `hurt` <- Fall (he goes down, the bow dropped: the engine's `hurt` is the fall); `prone` <-
Prone, played in reverse (the sheet draws him lying then pushing up on an arm; the engine falls through the row, lies at its last frame and gets
up backwards -- sprites.js S.proneRow, the hobgoblin's way). New rows, named here (not in pixelate.py): `volley` (the Hunter's Volley: its
`release` is where the three arrows leave), `whirlwind` (Whirlwind Attack), `parry`, `backstep`; and `slash`. `longbow`'s `release` is the frame
the string hand lets go (the arrow is gone from the bow: 10 of 13).
Facings (10-08 to 10-14; the art desk's pages since, below): E takes the side rows as drawn, W mirrored. His four isometric sheets (10-08, sheets 3-6: BOTTOM RIGHT, BOTTOM LEFT -- the last of two,
its volley shooting the right way -- TOP LEFT, TOP RIGHT) give SE, SW, NW and NE their own drawings, no mirror, of the seven rows they carry:
slash (and attack), volley, whirlwind, parry, backstep, prone, the fall (hurt); S borrows the bottom-right's and N the top-right's (ISO_NEAR).
The rows they don't carry (walk, longbow, cast, climb, flinch) play side-on there, SW and NW mirrored. The idle: S the turnaround's Front
still and N its Back (one still in both frames); each diagonal its sheet's standing still (STILLS: cut out first, then painted navy), the
bottom-left -- which has none -- the bottom-right's mirrored. Each isometric sheet meets sheet 2 by height (the five rows' first frames, the
guard) and is toned to sheet 2's same rows.
THE ART DESK'S PAGES (10-14, sorted from deep16/_src/Fresh into _src/greyfang/ART-01 and ART-32, pages 7-18 here): ART-01 his Idle 4, Walk 8,
Bow 10, Hurt 6, Cast 7 from the bottom-right and the top-right, and Climb 6 from behind; ART-32 every row from the front (S) and straight behind
(N) -- Walk, Bow, Hurt, Cast, Slash, Volley, Whirlwind, Prone, Fall, Parry, Backstep. So all eight facings now (RULED 10-14, five drawn views,
SW, W and NW mirrored): S and N play their own drawing of every row but the idle (the turnaround's Front and Back stills, as before) and the
climb; SE and NE take ART-01's idle, walk, bow, flinch and cast (SW and NW mirrored), their combat rows still their four sheets'; the climb is
ART-01's from behind in every facing; E and W keep the side rows, thinned to the views' counts (SIDE_PICK). Scale: each view meets the drawing
of its own view already in the game, by area (MEET_VIEW), its other pages its first (MEET). Colour: the fur balanced (tones(); every page came
within 2.5%), and ART-01 desaturated to its combat sheets' cloak (SAT), the top-right's turned toward the moss (TURN_HUE). ART-32's trousers
read as navy to the grey test: FILL. The art desk's open defects (the quiver on his left shoulder in the back Slash 3, Whirlwind 1-2, Prone and
Fall; an uneven spin; the bow's aim reading sideways from the front and back) are cut as drawn.
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

FILES = {1: os.path.join('greyfang', 'Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png'),
         2: os.path.join('greyfang', 'Greyfang’s extra moves sprite sheet-2.png'),     # (a curly apostrophe)
         # his four isometric sheets (10-08, Griz: "the art department is putting out sprites thinking this is a 2D game. It's now generating
         # based on isometry"): sheet 2's moves from each screen diagonal, one sheet a view; the bottom-left is the last of two ("Use the last
         # bottom-left image -- it corrects the Volley's firing direction": Greyfang isometric combat sprite sheet-2.png's volley shot right)
         3: os.path.join('greyfang', 'Greyfang’s Isometric Combat Sprite Sheet-1.png'),   # BOTTOM RIGHT -> SE (a curly apostrophe)
         4: os.path.join('greyfang', "GreyFang's Eight-Frame Bow Volley-5.png"),           # BOTTOM LEFT -> SW
         5: os.path.join('greyfang', 'Greyfang Isometric Combat Sprite Sheet-3.png'),      # TOP LEFT (titled only GREYFANG) -> NW
         6: os.path.join('greyfang', 'Greyfang isometric combat sprite sheet-4.png')}      # TOP RIGHT -> NE
# the art desk's pages (10-14), named by page ID: ART-01 his other rows from the bottom-right (SE) and the top-right (NE), ART-32 every
# row from the front (S) and from behind (N)
A1, A32 = os.path.join('greyfang', 'ART-01'), os.path.join('greyfang', 'ART-32')
FILES.update({7: os.path.join(A1, 'ART-01_HEAD-1_PAGE-1.png'), 8: os.path.join(A1, 'ART-01_HEAD-1_PAGE-2.png'),
              9: os.path.join(A1, 'ART-01_HEAD-2_PAGE-1.png'), 10: os.path.join(A1, 'ART-01_HEAD-2_PAGE-2.png')})
FILES.update({10 + p: os.path.join(A32, 'ART-32_HEAD-3_PAGE-%d.png' % p) for p in (1, 2, 3, 4)})
FILES.update({14 + p: os.path.join(A32, 'ART-32_HEAD-5_PAGE-%d.png' % p) for p in (1, 2, 3, 4)})
SRC =os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
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
  # the art desk's pages (10-14): rows only, numbers under the frames, the row names in a column at the left (their boxes by hand, the
  # numbers' x as sheetrows finds them in each strip alone)
  7: dict(text=[(0, 150, 125, 200), (0, 388, 125, 435), (0, 638, 125, 682)],                 # ART-01 HEAD 1 PAGE 1, SE
          rows=[('idle', (0, 60, 1774, None), (258, 278), NUM(4), [266, 475, 680, 882]),
                ('walk', (0, None, 1774, None), (496, 517), NUM(8), [268, 450, 622, 800, 981, 1164, 1365, 1571]),
                ('bow', (0, None, 1774, None), (755, 779), NUM(10), [235, 390, 542, 696, 852, 1026, 1198, 1360, 1520, 1670])]),
  8: dict(text=[(0, 234, 125, 278), (0, 542, 125, 587)],                                      # ART-01 HEAD 1 PAGE 2, SE
          rows=[('hurt', (0, 120, 1774, None), (350, 373), NUM(6), [272, 509, 722, 950, 1178, 1405]),
                ('cast', (0, None, 1774, None), (660, 683), NUM(7), [271, 484, 708, 930, 1154, 1375, 1602])]),
  9: dict(text=[(0, 150, 125, 198), (0, 387, 125, 435), (0, 638, 125, 682)],                 # ART-01 HEAD 2 PAGE 1, NE
          rows=[('idle', (0, 60, 1774, None), (260, 280), NUM(4), [264, 474, 678, 885]),
                ('walk', (0, None, 1774, None), (499, 521), NUM(8), [266, 452, 634, 816, 1002, 1184, 1378, 1580]),
                ('bow', (0, None, 1774, None), (756, 780), NUM(10), [234, 390, 542, 696, 854, 1026, 1194, 1358, 1515, 1669])]),
  10: dict(text=[(0, 154, 125, 199), (0, 398, 115, 442), (0, 654, 140, 700)],                # ART-01 HEAD 2 PAGE 2, NE
           rows=[('hurt', (0, 60, 1774, None), (266, 288), NUM(6), [280, 508, 751, 991, 1233, 1458]),
                 ('cast', (0, None, 1774, None), (520, 542), NUM(7), [279, 500, 718, 942, 1151, 1380, 1602]),
                 ('climb', (0, None, 1774, None), (786, 807), NUM(6), [330, 556, 766, 987, 1214, 1448])]),
  11: dict(text=[(0, 154, 104, 198), (0, 463, 90, 505), (0, 769, 100, 811)],                 # ART-32 HEAD 3 PAGE 1, S
           rows=[('walk', (0, 40, 1536, None), (293, 312), NUM(8), [193, 374, 546, 706, 872, 1046, 1222, 1396]),
                 ('bow', (0, None, 1536, None), (598, 618), NUM(10), [164, 302, 440, 570, 712, 855, 1000, 1146, 1290, 1440]),
                 ('hurt', (0, None, 1536, None), (908, 927), NUM(6), [208, 414, 618, 821, 1024, 1220])]),
  12: dict(text=[(0, 153, 102, 200), (0, 450, 121, 499), (0, 773, 126, 828)],                # ART-32 HEAD 3 PAGE 2, S
           rows=[('cast', (0, 20, 1536, None), (278, 299), NUM(7), [206, 410, 598, 782, 977, 1158, 1354]),
                 ('slash', (0, None, 1536, None), (609, 630), NUM(6), [222, 446, 664, 888, 1124, 1348]),
                 ('volley', (0, None, 1536, None), (923, 944), NUM(8), [214, 386, 541, 701, 871, 1056, 1238, 1411])]),
  13: dict(text=[(0, 174, 170, 216), (0, 454, 113, 497), (0, 714, 78, 770)],                 # ART-32 HEAD 3 PAGE 3, S
           rows=[('whirlwind', (0, 30, 1536, None), (313, 334), NUM(8), [250, 415, 589, 758, 920, 1088, 1268, 1437]),
                 ('prone', (0, None, 1536, None), (574, 595), NUM(2), [287, 646]),
                 ('fall', (0, None, 1536, None), (873, 894), NUM(6), [199, 398, 598, 820, 1080, 1370])]),
  14: dict(text=[(0, 271, 143, 330), (0, 664, 187, 723)],                                     # ART-32 HEAD 3 PAGE 4, S
           rows=[('parry', (0, 90, 1536, None), (416, 444), NUM(6), [260, 490, 709, 924, 1182, 1396]),
                 ('backstep', (0, None, 1536, None), (812, 842), NUM(6), [269, 492, 715, 938, 1176, 1399])]),
  15: dict(text=[(0, 141, 121, 188), (0, 460, 93, 503), (0, 759, 98, 801)],                  # ART-32 HEAD 5 PAGE 1, N
           rows=[('walk', (0, 40, 1536, None), (279, 298), NUM(8), [220, 378, 530, 690, 854, 1010, 1171, 1334]),
                 ('bow', (0, None, 1536, None), (579, 599), NUM(10), [166, 292, 438, 574, 708, 848, 1008, 1164, 1316, 1452]),
                 ('hurt', (0, None, 1536, None), (894, 914), NUM(6), [198, 368, 544, 710, 896, 1068])]),
  16: dict(text=[(0, 154, 98, 198), (0, 459, 108, 503), (0, 761, 116, 812)],                 # ART-32 HEAD 5 PAGE 2, N
           rows=[('cast', (0, 10, 1536, None), (289, 308), NUM(7), [202, 396, 590, 783, 990, 1192, 1387]),
                 ('slash', (0, None, 1536, None), (602, 622), NUM(6), [214, 420, 632, 860, 1088, 1320]),
                 ('volley', (0, None, 1536, None), (907, 928), NUM(8), [201, 366, 531, 699, 876, 1084, 1270, 1436])]),
  17: dict(text=[(0, 165, 162, 205), (0, 437, 103, 476), (0, 724, 71, 771)],                 # ART-32 HEAD 5 PAGE 3, N
           rows=[('whirlwind', (0, 40, 1536, None), (297, 319), NUM(8), [221, 382, 542, 724, 906, 1094, 1281, 1444]),
                 ('prone', (0, None, 1536, None), (586, 607), NUM(2), [252, 537]),
                 ('fall', (0, None, 1536, None), (887, 909), NUM(6), [222, 414, 619, 849, 1104, 1378])]),
  18: dict(text=[(0, 220, 131, 279), (0, 639, 178, 710)],                                     # ART-32 HEAD 5 PAGE 4, N
           rows=[('parry', (0, 90, 1536, None), (401, 429), NUM(6), [250, 474, 690, 910, 1130, 1366]),
                 ('backstep', (0, None, 1536, None), (822, 850), NUM(6), [280, 484, 696, 910, 1122, 1373])]),
}
# the isometric sheets' standing stills (one figure, no number): the box it lies in -- cut out first, then painted navy so the slash row
# below it (the top-left's, whose first two frames reach up beside it) doesn't take a piece of it
STILLS = {3: [(620, 8, 756, 119)], 5: [(248, 5, 372, 135)], 6: [(530, 4, 628, 52), (508, 52, 628, 130)]}   # (boxes, joined: the top-right's title ends at x 520)
ISO = {7: 3, 1: 4, 3: 5, 5: 6}            # facing (SE, SW, NW, NE) -> its isometric sheet, drawn as it faces (no mirror)
# the art desk's views (10-14): engine row -> (page, its row) per view; a facing -> (view, mirrored). S and N play every row their own way
# now (they borrowed the bottom-right's and top-right's combat rows till then, and the side's walk, bow, cast and flinch); the diagonals
# take ART-01's idle, walk, bow, flinch and cast (they played those side-on), SW and NW mirrored -- his combat rows stay their four sheets'
VIEW_PAGES = {'SE': (7, 8), 'NE': (9, 10), 'S': (11, 12, 13, 14), 'N': (15, 16, 17, 18)}
VIEWS = {'SE': {'idle': (7, 'idle'), 'walk': (7, 'walk'), 'longbow': (7, 'bow'), 'flinch': (8, 'hurt'), 'cast': (8, 'cast')},
         'NE': {'idle': (9, 'idle'), 'walk': (9, 'walk'), 'longbow': (9, 'bow'), 'flinch': (10, 'hurt'), 'cast': (10, 'cast')}}
for _v, _p in (('S', 11), ('N', 15)):
    VIEWS[_v] = {'walk': (_p, 'walk'), 'longbow': (_p, 'bow'), 'flinch': (_p, 'hurt'), 'cast': (_p + 1, 'cast'), 'attack': (_p + 1, 'slash'),
                 'volley': (_p + 1, 'volley'), 'whirlwind': (_p + 2, 'whirlwind'), 'prone': (_p + 2, 'prone'),
                 'hurt': (_p + 2, 'fall'), 'parry': (_p + 3, 'parry'), 'backstep': (_p + 3, 'backstep')}
VIEW_OF = {0: ('S', False), 4: ('N', False), 7: ('SE', False), 1: ('SE', True), 5: ('NE', False), 3: ('NE', True)}
CLIMB = (10, 'climb')                     # ART-01's climb from behind plays in every facing, as drawn (a wall is climbed facing it)
# a view's first page meets the drawing of its own view already in the game, by area (holes filled): the diagonals' idle (the bow low, a
# crouched guard) the first frames of their isometric sheets' Volley and Backstep (the same guard; by area ART-01 meets both at K 2.75, and its
# walk then stands as much of him as the side walk, 45.8 and 46.5 to 46.9 -- matched to the side walk by height instead, it stood a fifth
# heavier than the swing beside it, lineup 10-14); the front's walk the turnaround's Front still and the back's its Back still (the S and N
# idle, so the walk is the still's size; by height the back agrees within a percent, the front would come out 6% bigger, its stooped walk as
# tall as the upright still)
MEET_VIEW = {'SE': ('idle', [(3, 'volley'), (3, 'backstep')]), 'NE': ('idle', [(6, 'volley'), (6, 'backstep')]),
             'S': ('walk', [('t', 'front')]), 'N': ('walk', [('t', 'back')])}
# a page -> (its frames that stand at ease, the frames of a page already met that stand the same way): it meets that page by area
MEET = {8: ([('hurt', 5), ('cast', 0), ('cast', 6)], [(7, 'idle', i) for i in range(4)]),           # back on guard, the bow low
        10: ([('hurt', 5), ('cast', 0), ('cast', 6)], [(9, 'idle', i) for i in range(4)])}
for _p in (11, 15):
    MEET[_p + 1] = ([('cast', 0), ('cast', 6), ('volley', 7)], [(_p, 'bow', 8), (_p, 'bow', 9), (_p, 'hurt', 5)])                  # the bow low
    MEET[_p + 2] = ([('whirlwind', 0), ('whirlwind', 7)], [(_p + 1, 'slash', 0), (_p + 1, 'slash', 5)])                             # the sword low
    MEET[_p + 3] = ([('parry', 0), ('parry', 5), ('backstep', 0)], [(_p + 1, 'slash', 0), (_p + 1, 'slash', 5), (_p + 1, 'cast', 0), (_p + 1, 'cast', 6)])
# the side rows thinned so every facing plays one count (the art desk's views draw Walk 8 and Bow 10, the side 9 and 13): the bow keeps its
# release (side frame 10 -> 7, as every view's) and drops 2, 4 and 6 (the bow raised before the nock, a half-nock, 5 again); the walk drops
# its frame 2 (1 and 3 overlap 0.85 aligned, more than most steps of the cycle do: the smoothest drop); the side idle's two frames play
# twice, for the diagonals' four
SIDE_PICK = {'idle': [0, 1, 0, 1], 'walk': [0, 2, 3, 4, 5, 6, 7, 8], 'longbow': [0, 2, 4, 6, 7, 8, 9, 10, 11, 12]}
BORROW = {('volley', 3): 6}              # (row, facing) -> the iso sheet whose row it plays MIRRORED: the top-left's Volley holds a blade, not the bow,
                                          # in frames 4-5 (Griz, 10-14: "he pulls out his sword and returns to bow in his hand, and shoots volley"), so NW
                                          # plays the top-right's Volley mirrored, the two-view sheets' way (NW <- NE mirrored)
ISO_ROWS = {'attack': 'slash', 'volley': 'volley', 'whirlwind': 'whirlwind', 'parry': 'parry', 'backstep': 'backstep',
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
                         ((1305, 366, 1358, 424), '7')]},
       # the dropped bows (ART-32): a bow lying loose between two bodies is dealt out pixel by pixel to the nearer, so each goes whole to its own
       13: {'fall': [((896, 778, 958, 862), '4')]},           # the front Fall 4's bow, beside him (its right end nears 5's cloak)
       17: {'prone': [((376, 462, 484, 568), '2')],           # the back Prone 2's bow, left of him (its tip nearer 1's body)
            'fall': [((972, 760, 1072, 858), '5')]}}          # the back Fall 5's bow (its left end nearer 4's hand)
FILL, FILL_D, FILL_R = range(11, 19), 30, 12
# ART-32's pages draw his trousers a dark blue-grey that sheetrows' grey test (blue minus red under 20) reads as navy, so the legs came out
# holed. Two mends, ART-32 only: a pixel with red FILL_R or more that joins the figure is figure (the knees' pale blue patches, red 30-60; the
# navy's red is 0-6 and the ground shadows' 0-3); and a hole in the figure whose pixel is more than FILL_D from the navy (the empty navy is
# 12 at most) is filled -- the legs come back whole and a real gap (the bow and its string, under an arm, inside a sword's arc) stays open
# (holes-*.png and spots-12.png, 10-14). Not ART-01's: its navy brightens round each figure, and the gap between bow and string there reads
# 30-50 from the page's navy
CUT = {13: {'whirlwind': [((1189, 118), (1196, 178))]}}     # the front Whirlwind 6's arc ends a few px from 7's blade tip, its glow between (FILL_R)
TOUCH_OK = {}

# the engine's rows: engine name -> (sheet, row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'longbow': (1, 'bow'), 'attack': (2, 'slash'), 'cast': (1, 'cast'),
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
NEW = ['volley', 'whirlwind', 'parry', 'backstep', 'headless']    # this cutter's own rows (named here, not in pixelate.py)
FPS = {'headless': 8, 'idle': 4, 'walk': 10, 'longbow': 12, 'attack': 12, 'cast': 8, 'climb': 8, 'flinch': 10, 'hurt': 8, 'prone': 8,
       'volley': 12, 'whirlwind': 14, 'parry': 10, 'backstep': 12}
RELEASE = {'longbow': 6, 'volley': 5}     # the frame the arrow(s) are gone from the string: js/battle.js times the shot by it (0-based; the
                                          # longbow's was the side's 9 of 13 till 10-14, its 7th frame of 10 now, as every view draws it)
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


def saturation(px):
    """HSV saturation of an (n, 3) array of 0-255 RGB"""
    mx, mn = px.max(-1), px.min(-1)
    return np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)


def colour_sat(frs, tone=None):
    """the median saturation of the coloured pixels (saturation over 0.2, value over 0.12) of cut frames"""
    px = np.concatenate([np.asarray(im)[np.asarray(im)[..., 3] > 0][:, :3] for im in frs]).astype(float)
    if tone is not None:
        px = np.clip(px * np.array(tone), 0, 255)
    s = saturation(px)
    return float(np.median(s[(s > 0.2) & (px.max(-1) > 30)]))


def desaturated(im, f, turn=0):
    """each pixel's saturation times f, its value kept (each channel pulled toward the pixel's max); `turn`: the cloak's hues (34-40 fully,
    tapering to nothing at 29 and at 66 -- the leather, the bow and the quiver, 15-30, stay) turned that many degrees toward the green first"""
    a = np.asarray(im).astype(float)
    if turn:
        rgb = a[..., :3] / 255.0
        mx, mn = rgb.max(-1), rgb.min(-1)
        d = np.maximum(mx - mn, 1e-6)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
        s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        h = (h + turn * np.clip((h - 29) / 5, 0, 1) * np.clip((66 - h) / 26, 0, 1) * np.clip((s - 0.12) / 0.1, 0, 1)) % 360
        cc = mx * s
        x = cc * (1 - np.abs((h / 60) % 2 - 1))
        sec = (h // 60).astype(int) % 6
        z = np.zeros_like(cc)
        out = np.select([sec[..., None] == k for k in range(6)],
                        [np.stack(t, -1) for t in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))])
        a[..., :3] = (out + (mx - cc)[..., None]) * 255
    mx = a[..., :3].max(-1, keepdims=True)
    a[..., :3] = mx - (mx - a[..., :3]) * f
    return Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), 'RGBA')


# ART-01 drew him in the same hues as his combat sheets but more saturated (its cloak's olive at 0.67-0.87 to theirs' 0.44-0.60), and so a
# khaki cloak against their moss: each view's two pages take SAT (that view's combat sheet's guard frames, Volley, Backstep, Slash and Parry
# 1, against its idle: the median saturation of the coloured pixels), the hue and the value kept -- a per-channel balance moves the greys
# with it (it turned his fur blue) and a hue turn made the cloak lime (both tried, 10-14)
SAT_VIEW = {'SE': 3, 'NE': 6}
SAT, TURN_HUE = {}, {9: 10, 10: 10}        # ART-01's top-right pages: their cloak, lit pale, came out tan beside the top-right sheet's moss (10-14)


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
    orig_mask = SR.figure_mask
    if L in FILL:
        def filled(a, *args, **kw):
            m = orig_mask(a, *args, **kw)
            lab, _ = ndimage.label(m | (a[..., 0] >= FILL_R), structure=np.ones((3, 3)))   # the pale knees, joined to him
            m = np.isin(lab, np.unique(lab[m]))
            navy = np.median(a.reshape(-1, 3)[::97], axis=0)
            return m | (ndimage.binary_fill_holes(m) & ~m & (np.abs(a - navy).sum(-1) > FILL_D))
        SR.figure_mask = filled
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
        SR.label_xs, SR.figure_mask = orig, orig_mask
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
    for v, pages in VIEW_PAGES.items():                       # the art desk's views (10-14): each meets the drawing of its own view already in
        L1 = pages[0]                                         # the game, by area (MEET_VIEW); its other pages by area against its first (MEET)
        row, refs = MEET_VIEW[v]
        ref = float(np.median([body(c[1]['turn'][TURN.index(s)][1])[0] / K['t'] if Lr == 't' else body(c[Lr][s][0][1])[0] / K[Lr] for Lr, s in refs]))
        K[L1] = med(c[L1][row]) / ref
        said = ['by its %s; its walk stands %.1f px high in the game, the side walk %.1f' % (row, med(c[L1]['walk'], 1) / K[L1], med(c[1]['walk'], 1) / k1)]
        for L, (mine, theirs) in MEET.items():
            if L in pages:
                r = float(np.median([body(c[L][row][i][1])[0] for row, i in mine])) / float(np.median([body(c[Lt][row][i][1])[0] for Lt, row, i in theirs]))
                K[L] = K[theirs[0][0]] * r
                said.append('page %d %.3f (%.3f of page %d)' % (L, K[L], r, theirs[0][0]))
        print('  K: %s page %d %.3f (%s)' % (v, L1, K[L1], '; '.join(said)))
    return K


def grey_mean(im):
    """mean RGB over a cut frame's light greys -- his fur's pale parts, the muzzle, the tail's tips (each channel within GREY_SPREAD of the
    others, brighter than GREY_MIN: sheet 1's dark trousers are a blue-grey, and counted they pulled ART-01's fur blue)"""
    a = np.asarray(im).astype(int)
    rgb = a[..., :3]
    m = (a[..., 3] > 0) & (rgb.max(-1) - rgb.min(-1) < GREY_SPREAD) & (rgb.mean(-1) > GREY_MIN) & (rgb.mean(-1) < 230)
    return rgb[m].mean(0)


GREY_SPREAD, GREY_MIN = 30, 110


def tones(c):
    """the art desk's pages brought to sheet 1's colour, per channel, by the greys alone (grey_mean: the whole figure's mean pushed ART-01's
    fur blue -- its olive cloak and brown leather, against sheet 1's green, read as too little blue): each view's first page against sheet
    1's same view (the diagonals against its idle and walk, the front against the turnaround's Front still, the back against its Back
    still), its other pages against their first page by the frames MEET pairs"""
    mean = lambda frs: np.mean([grey_mean(im) for im in frs], axis=0)
    T = {}
    for v, pages in VIEW_PAGES.items():
        L1 = pages[0]
        ref = {'S': [im for nm, im, _ in c[1]['turn'] if nm == 'front'], 'N': [im for nm, im, _ in c[1]['turn'] if nm == 'back']}.get(
            v, [im for r in ('idle', 'walk') for _, im, _ in c[1][r]])
        own = [im for r in (('walk',) if v in ('S', 'N') else ('idle', 'walk')) for _, im, _ in c[L1][r]]
        T[L1] = mean(ref) / mean(own)
        for L, (mine, theirs) in MEET.items():
            if L in pages:
                T[L] = T[theirs[0][0]] * mean([c[Lt][row][i][1] for Lt, row, i in theirs]) / mean([c[L][row][i][1] for row, i in mine])
        for L in pages:                                       # a balance, not a brightening: each page keeps its own light (a mean of 1)
            T[L] = T[L] / T[L].mean()
        if v in SAT_VIEW:
            iso = SAT_VIEW[v]
            theirs = colour_sat([c[iso][r][0][1] for r in ('volley', 'backstep', 'slash', 'parry')], TONE[iso])
            mine = colour_sat([im for _, im, _ in c[L1]['idle']], T[L1])
            for L in pages:
                SAT[L] = theirs / mine
            print('  saturation: %s pages %s x%.3f (its idle %.2f, iso sheet %d\'s guards %.2f)' % (v, pages, theirs / mine, mine, iso, theirs))
        print('  tone: %s' % ', '.join('page %d %s' % (L, np.round(T[L], 3).tolist()) for L in pages if L in T))
    return {L: tuple(float(x) for x in t) for L, t in T.items()}


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    TONE.update(tones(c))
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
                a = game_frame(desaturated(im, SAT[L], TURN_HUE.get(L, 0)) if L in SAT else im, K[L], TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    def still(name):
        for nm, im, box in c[1]['turn']:
            if nm == name:
                a = game_frame(im, K['t'])
                return a, core_x(a), 0
    MIRROR = (1, 2, 3)                                        # the side rows face right: SW, W and NW take them mirrored
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        if eng in SIDE_PICK:
            side = [side[i] for i in SIDE_PICK[eng]]
        if eng in REVERSED:
            side = side[::-1]
        n = len(side)
        per = []                                              # per facing: (frames, mirrored?)
        for f in range(8):
            view, vmir = VIEW_OF.get(f, (None, False))
            if eng == 'climb':                                # ART-01's climb from behind, in every facing as drawn
                per.append((frames_of(*CLIMB), False))
            elif f in STILL.get(eng, {}):
                per.append(([still(STILL[eng][f])] * n, False))
            elif (eng, f) in BORROW:                          # another view's row, mirrored (BORROW)
                fs = frames_of(BORROW[(eng, f)], ISO_ROWS[eng])
                per.append((fs[::-1] if eng in REVERSED else fs, True))
            elif eng in ISO_ROWS and f in ISO:                # a diagonal's combat rows: its own isometric sheet's, as drawn
                fs = frames_of(ISO[f], ISO_ROWS[eng])
                per.append((fs[::-1] if eng in REVERSED else fs, False))
            elif view and eng in VIEWS[view]:                 # the art desk's views: S and N every row, the diagonals the rest (SW, NW mirrored)
                fs = frames_of(*VIEWS[view][eng])
                per.append((fs[::-1] if eng in REVERSED else fs, vmir))
            else:
                per.append((side, f in MIRROR))
        if len({len(fs) for fs, _ in per}) > 1:
            raise SystemExit('%s: the facings play %s frames' % (eng, [len(fs) for fs, _ in per]))
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
                      'the extra moves, one a diagonal; 2026-10-14, the art desk\'s ART-01 and ART-32: the rest of his rows from the '
                      'bottom-right and top-right, and every row from the front and from behind), cut by tools/greyfang-sheet.py')
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
    for eng in sorted(set(frames) - {'headless'}):              # every facing of a row: E, then SE, SW, NW, NE, then S and N
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
