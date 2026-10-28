"""DEEP16 pipeline 2 (generated art): the art desk's harpy pages -> harpy_p1, a creature new to the grid (10-28, the monster cutter seat on
Griz's "filled fresh with harpies - probably a 'make the best of what it gave you' situation", to the lanes desk).

    python tools/harpy-sheet.py            # deep16/art/harpy_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/harpy/ -- a worktree reads them there):
  SE and NE, ART-14 (10-10, in _src/harpy/ itself): HEAD 1 SE and HEAD 2 NE, PAGE 1 Idle 6, Walk 8, Fly 8 (SE's with its identity drawings
  over them), PAGE 2 Claws 6, Club 6, Song 6, PAGE 3 Flinch 4, Fall 6, Prone 2 -- their Claws rows superseded: SE's from the combined
  correction "Harpy claw strike animation sheet.png" (its SE row only; Griz rejected its NE row), NE's from ART-14-CLAWS-NE-REVISED.png.
  S, E and N, ART-56 (10-20, best available, in _src/harpy/ART-56/): one action a page, Idle 6, Walk 8, Fly 8, Claws 6, Club 6, Song 6,
  Flinch 4, Fall 6, Prone 2. Its zip came cut short; the pages came again loose into Fresh 10-27 under the generator's titles, matched to
  their page names by pixels against the 21 whole pages the zip still held, and N's Claws by the zip's own CRC-32 (the map:
  _src/art-desk/received-2026-10-27-ART-56-harpy-LOOSE/MAP.md).
What each became: idle, walk, attack <- Club (its club plays `attack`), claw <- Claws (the attack names its `row: 'claw'`), flinch, hurt <-
Fall (played once), prone <- Prone played backwards, fly <- Fly (10-28, his "1 yes": a sheet's fly row plays while its unit is aloft,
js/ui.js -- ART-14's SE and NE Fly rows, ART-56's S, E and N Fly pages at their view's median scale). Song is NOT cut: the Luring Song (a
charm that walks a hero to her) is not on the grid. Facings: the five views as drawn, SW, W and
NW the mirrors of SE, E and NE.
The boxes by the seat's probe (bodies clustered into each page's rows, each frame's x its body's middle; the SE claw row by its printed
numbers -- its frames 3 and 4 touch; NE's Club row by hand to end at its numbers, the Song row's notes below them read as numbers; by hand too, SE's Idle band starts under the
portrait's edge, and the last letters of SE's "Prone").
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 50 px from every side -- a hunched woman on bird legs under her
wings, Medium, at the heroes' height or a little under (they stand 49 to 54: tools/sheetrows.py STANDS). A later page by its first frame
against its view's Idle 1, a Prone page by its Prone 1 at its own view's Fall 6. Two passes: the second tones every page per channel to
its own view's first-pass idle, the others to the E's.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

NAME = 'harpy_p1'
FW, FH, AX, AY = 104, 84, 52, 76   # (10-28: its Fly's raised wings 74 up -- it was 72 tall, AY 66; a fall 5 below the foot)                # (the flinch's feathers and the prone wings 48 px each side, SE's club raised 64 up)
STAND = {'side': 50, 'S': 50, 'N': 50}

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC = {
  'H1P1': (dict(file='ART-14_HEAD-1_PAGE-1.png', W=1536, text=[(15, 845, 65, 882), (17, 588, 39, 615), (19, 361, 55, 389), (34, 593, 55, 615), (51, 361, 67, 389), (51, 587, 66, 615), (61, 367, 82, 389), (61, 587, 82, 615)]),
           R(('ref', (0, 0, 1536, 255), (228, 255), 5, [163, 527, 800, 1076, 1360]), ('idle', (0, 277, 1536, 478), (456, 478), 6, [213, 448, 677, 895, 1114, 1341]), ('walk', (0, 479, 1536, 718), (696, 718), 8, [184, 361, 542, 724, 912, 1091, 1260, 1440]), ('fly', (0, 719, 1536, 997), (976, 997), 8, [129, 317, 507, 722, 903, 1077, 1257, 1441]))),
  'H1P2': (dict(file='ART-14_HEAD-1_PAGE-2.png', W=1536, text=[(13, 464, 34, 491), (13, 784, 34, 811), (14, 149, 46, 177), (29, 463, 46, 491), (29, 789, 50, 811), (40, 154, 61, 177), (40, 469, 61, 491), (45, 789, 66, 811), (56, 154, 80, 177), (56, 463, 77, 491), (75, 154, 96, 177)]),
           R(('clawold', (0, 0, 1536, 303), (280, 303), 6, [187, 416, 653, 890, 1136, 1387]), ('attack', (0, 304, 1536, 620), (597, 620), 6, [183, 413, 647, 876, 1125, 1377]), ('song', (0, 621, 1536, 945), (921, 945), 6, [175, 411, 644, 880, 1130, 1379]))),
  'H1P3': (dict(file='ART-14_HEAD-1_PAGE-3.png', W=1536, text=[(21, 489, 42, 518), (22, 163, 43, 192), (22, 821, 43, 850), (36, 494, 57, 518), (38, 163, 57, 192), (39, 826, 60, 850), (52, 168, 70, 192), (52, 489, 70, 518), (54, 161, 67, 174), (55, 826, 76, 850), (65, 168, 86, 192), (65, 489, 83, 518), (81, 163, 120, 192), (72, 822, 110, 850)]),
           R(('flinch', (0, 0, 1536, 331), (307, 331), 4, [288, 598, 861, 1141]), ('hurt', (0, 332, 1536, 654), (629, 654), 6, [193, 417, 640, 874, 1117, 1379]), ('prone', (0, 655, 1536, 967), (942, 967), 2, [281, 652]))),
  'H2P1': (dict(file='ART-14_HEAD-2_PAGE-1.png', W=1536, text=[(15, 786, 75, 828), (15, 448, 40, 479), (17, 160, 58, 191), (35, 448, 72, 480), (55, 160, 91, 191), (68, 448, 91, 480)]),
           R(('idle', (0, 0, 1536, 277), (255, 277), 6, [223, 475, 726, 939, 1155, 1377]), ('walk', (0, 278, 1536, 572), (549, 572), 8, [182, 360, 530, 698, 871, 1042, 1232, 1420]), ('fly', (0, 573, 1536, 939), (916, 939), 8, [135, 324, 514, 713, 889, 1067, 1249, 1433]))),
  'H2P2': (dict(file='ART-14_HEAD-2_PAGE-2.png', W=1536, text=[(16, 172, 40, 204), (16, 457, 40, 489), (16, 780, 39, 811), (35, 172, 54, 204), (35, 457, 54, 489), (35, 786, 58, 811), (48, 178, 71, 204), (48, 464, 71, 489), (54, 786, 77, 811), (68, 178, 94, 204), (68, 457, 91, 489), (74, 786, 97, 818), (90, 178, 113, 204)]),
           R(('clawold', (0, 0, 1536, 302), (276, 302), 6, [245, 484, 712, 950, 1170, 1393]), ('attack', (0, 303, 1536, 612), (584, 612), 6, [241, 477, 698, 931, 1155, 1390]), ('song', (0, 613, 1536, 942), (916, 942), 6, [227, 450, 673, 912, 1149, 1384]))),
  'H2P3': (dict(file='ART-14_HEAD-2_PAGE-3.png', W=1536, text=[(17, 787, 39, 816), (22, 184, 44, 214), (22, 479, 44, 509), (35, 792, 54, 816), (37, 484, 59, 509), (38, 184, 55, 214), (49, 792, 71, 816), (51, 184, 69, 214), (55, 479, 72, 509), (65, 190, 88, 214), (67, 479, 85, 509), (67, 792, 90, 816), (83, 190, 106, 214), (86, 792, 108, 816), (101, 184, 123, 214)]),
           R(('flinch', (0, 0, 1536, 329), (303, 329), 4, [237, 539, 873, 1184]), ('hurt', (0, 330, 1536, 645), (605, 645), 6, [195, 436, 671, 896, 1154, 1395]), ('prone', (0, 646, 1536, 934), (911, 934), 2, [308, 655]))),
  'H1C': (dict(file='Harpy claw strike animation sheet.png', W=1536, text=[(10, 238, 135, 267)]),     # (its SE row only, by its printed numbers: frames 3 and 4 touch)
           R(('claw', (0, 0, 1536, 435), (410, 435), 6, [237, 464, 696, 931, 1173, 1403]))),
  'H2C': (dict(file='ART-14-CLAWS-NE-REVISED.png', W=2172, text=[(15, 311, 179, 348)]),
           R(('claw', (0, 0, 2172, 577), (540, 577), 6, [328, 635, 958, 1307, 1627, 1949]))),
  'H3P1': (dict(file='ART-56_HEAD-3_PAGE-1.png', W=1536, text=[(22, 393, 79, 435)]),
           R(('idle', (0, 0, 1536, 472), (396, 472), 3, [302, 776, 1260]), ('idle_b', (0, 473, 1536, 924), (891, 924), 3, [295, 772, 1259]))),
  'H3P2': (dict(file='ART-56_HEAD-3_PAGE-2.png', W=1536, text=[(22, 350, 76, 387)]),
           R(('walk', (0, 0, 1536, 468), (439, 468), 4, [278, 630, 968, 1320]), ('walk_b', (0, 469, 1536, 902), (873, 902), 4, [229, 598, 960, 1325]))),
  'H3P4': (dict(file='ART-56_HEAD-3_PAGE-4.png', W=1536, text=[]),
           R(('claw', (0, 0, 1536, 459), (428, 459), 3, [268, 762, 1258]), ('claw_b', (0, 460, 1536, 928), (898, 928), 3, [266, 759, 1257]))),
  'H3P5': (dict(file='ART-56_HEAD-3_PAGE-5.png', W=1536, text=[(23, 369, 53, 410)]),
           R(('attack', (0, 0, 1536, 470), (437, 470), 3, [292, 765, 1235]), ('attack_b', (0, 471, 1536, 929), (895, 929), 3, [286, 764, 1243]))),
  'H3P7': (dict(file='ART-56_HEAD-3_PAGE-7.png', W=1536, text=[(35, 459, 206, 505)]),
           R(('flinch', (0, 0, 1536, 480), (436, 480), 2, [460, 1088]), ('flinch_b', (0, 481, 1536, 944), (905, 944), 2, [474, 1065]))),
  'H3P8': (dict(file='ART-56_HEAD-3_PAGE-8.png', W=1774, text=[(25, 443, 109, 479)]),
           R(('hurt', (0, 0, 1774, 477), (417, 477), 3, [347, 876, 1442]), ('hurt_b', (0, 478, 1774, 801), (765, 801), 3, [291, 865, 1446]))),
  'H3P9': (dict(file='ART-56_HEAD-3_PAGE-9.png', W=2172, text=[(33, 293, 104, 343)]),
           R(('prone', (0, 0, 2172, 624), (581, 624), 2, [621, 1596]))),
  'H4P1': (dict(file='ART-56_HEAD-4_PAGE-1.png', W=1774, text=[(35, 254, 155, 302)]),
           R(('idle', (0, 0, 1774, 419), (384, 419), 3, [407, 915, 1443]), ('idle_b', (0, 420, 1774, 847), (811, 847), 3, [401, 904, 1452]))),
  'H4P2': (dict(file='ART-56_HEAD-4_PAGE-2.png', W=1774, text=[(18, 262, 143, 310)]),
           R(('walk', (0, 0, 1774, 408), (372, 408), 4, [340, 739, 1117, 1520]), ('walk_b', (0, 409, 1774, 828), (791, 828), 4, [270, 696, 1110, 1520]))),
  'H4P4': (dict(file='ART-56_HEAD-4_PAGE-4.png', W=1774, text=[(23, 423, 148, 460)]),
           R(('claw', (0, 0, 1774, 426), (396, 426), 3, [386, 907, 1433]), ('claw_b', (0, 427, 1774, 835), (804, 835), 3, [380, 912, 1414]))),
  'H4P5': (dict(file='ART-56_HEAD-4_PAGE-5.png', W=1774, text=[(37, 326, 152, 373)]),
           R(('attack', (0, 0, 1774, 431), (394, 431), 3, [395, 909, 1430]), ('attack_b', (0, 432, 1774, 828), (789, 828), 3, [384, 918, 1433]))),
  'H4P7': (dict(file='ART-56_HEAD-4_PAGE-7.png', W=1536, text=[(32, 357, 172, 397)]),
           R(('flinch', (0, 0, 1536, 495), (464, 495), 2, [426, 1051]), ('flinch_b', (0, 496, 1536, 951), (920, 951), 2, [451, 1070]))),
  'H4P8': (dict(file='ART-56_HEAD-4_PAGE-8.png', W=1536, text=[(36, 415, 125, 453)]),
           R(('hurt', (0, 0, 1536, 501), (471, 501), 3, [298, 732, 1252]), ('hurt_b', (0, 502, 1536, 890), (861, 890), 3, [265, 741, 1259]))),
  'H4P9': (dict(file='ART-56_HEAD-4_PAGE-9.png', W=2172, text=[(44, 331, 198, 377)]),
           R(('prone', (0, 0, 2172, 598), (550, 598), 2, [653, 1612]))),
  'H5P1': (dict(file='ART-56_HEAD-5_PAGE-1.png', W=1536, text=[(27, 446, 94, 485)]),
           R(('idle', (0, 0, 1536, 483), (424, 483), 3, [304, 764, 1249]), ('idle_b', (0, 484, 1536, 905), (874, 905), 3, [297, 773, 1256]))),
  'H5P2': (dict(file='ART-56_HEAD-5_PAGE-2.png', W=1536, text=[(16, 260, 41, 291), (16, 722, 41, 753), (37, 266, 60, 291), (37, 727, 59, 753), (57, 258, 75, 291), (57, 720, 75, 753), (69, 258, 93, 291), (69, 720, 93, 753)]),
           R(('walk', (0, 0, 1536, 467), (436, 467), 4, [269, 621, 978, 1334]), ('walk_b', (0, 468, 1536, 928), (898, 928), 4, [268, 621, 978, 1335]))),
  'H5P4': (dict(file='ART-56_HEAD-5_PAGE-4.png', W=1536, text=[(45, 486, 110, 521)]),
           R(('claw', (0, 0, 1536, 519), (448, 519), 3, [299, 736, 1230]), ('claw_b', (0, 520, 1536, 928), (897, 928), 3, [308, 763, 1239]))),
  'H5P5': (dict(file='ART-56_HEAD-5_PAGE-5.png', W=1536, text=[(28, 372, 129, 410)]),
           R(('attack', (0, 0, 1536, 469), (437, 469), 3, [329, 789, 1257]), ('attack_b', (0, 470, 1536, 928), (891, 928), 3, [302, 779, 1252]))),
  'H5P7': (dict(file='ART-56_HEAD-5_PAGE-7.png', W=2172, text=[(30, 390, 161, 428)]),
           R(('flinch', (0, 0, 2172, 623), (588, 623), 4, [379, 885, 1404, 1906]))),
  'H5P8': (dict(file='ART-56_HEAD-5_PAGE-8.png', W=1536, text=[(28, 466, 121, 507)]),
           R(('hurt', (0, 0, 1536, 482), (452, 482), 3, [322, 776, 1212]), ('hurt_b', (0, 483, 1536, 921), (890, 921), 3, [269, 753, 1260]))),
  'H5P9': (dict(file='ART-56_HEAD-5_PAGE-9.png', W=1536, text=[(28, 405, 170, 455)]),     # (its label by hand: the probe found no text)
           R(('prone', (0, 0, 1536, 781), (740, 781), 2, [472, 1159]))),
  # the S, E and N Fly pages (10-28): S in four lines of two (its third line prints no numbers: a strip of nothing between its feet and the next line's tops)
  'H3P3': (dict(file='ART-56_HEAD-3_PAGE-3.png', W=1536, text=[(25, 183, 83, 222)]),
           R(('fly', (0, 0, 1536, 257), (235, 257), 2, [484, 1014]), ('fly_b', (0, 258, 1536, 499), (471, 499), 2, [484, 1008]), ('fly_c', (0, 500, 1536, 722), (718, 722), 2, [480, 1012]), ('fly_d', (0, 723, 1536, 992), (965, 992), 2, [479, 1012]))),
  'H4P3': (dict(file='ART-56_HEAD-4_PAGE-3.png', W=2172, text=[(20, 318, 90, 365)]),
           R(('fly', (0, 0, 2172, 353), (327, 353), 4, [291, 772, 1316, 1854]), ('fly_b', (0, 354, 2172, 700), (674, 700), 4, [277, 803, 1355, 1877]))),
  'H5P3': (dict(file='ART-56_HEAD-5_PAGE-3.png', W=1536, text=[(15, 252, 85, 296), (0, 680, 110, 760)]),     # (a Fly label on each line)
           R(('fly', (0, 0, 1536, 471), (444, 471), 4, [225, 582, 973, 1344]), ('fly_b', (0, 472, 1536, 922), (897, 922), 4, [237, 583, 957, 1337]))),
}
# the rows drawn and not cut: the identity drawings over SE's Idle, Fly, Song, and ART-14's first Claws rows (superseded by the two
# correction sheets) -- their boxes kept, so a later rule that plays Fly or Song has them
UNCUT = {('H1P1', 'ref'), ('H1P2', 'clawold'), ('H1P2', 'song'), ('H2P2', 'clawold'), ('H2P2', 'song')}
PAGES = {}
for _L, (_p, (_rows, _xs)) in SPEC.items():
    _rows = [r for r in _rows if (_L, r[0]) not in UNCUT]
    PAGES[_L] = dict(_p, rows=_rows, xs={r: x for r, x in _xs.items() if (_L, r) not in UNCUT}, dir='ART-56' if _L[1] in '345' else '')
FIX = {}
CUTS = {'H1C': {'claw': [((810, 282), (810, 312))]}}     # (SE Claws 3's reach meets Claws 4 in a bridge 22 px tall at x 810: cut there)
# each view's pages, its Idle's first
VIEWS = {'SE': ('H1P1', 'H1C', 'H1P2', 'H1P3'), 'NE': ('H2P1', 'H2C', 'H2P2', 'H2P3')}
VIEWS.update({v: tuple('H%dP%d' % (h, p) for p in (1, 2, 4, 5, 7, 8, 9, 3)) for v, h in (('S', 3), ('E', 4), ('N', 5))})
FALL = {v: ('H%dP8' % h, 'H%dP9' % h) for v, h in (('S', 3), ('E', 4), ('N', 5))}     # (Fall page, Prone page); SE's and NE's share a page
JOINS = {r + '_b': r for r in ('idle', 'walk', 'attack', 'claw', 'flinch', 'hurt', 'prone', 'fly')}
JOINS.update({'fly_c': 'fly', 'fly_d': 'fly'})   # (S's Fly in four lines of two)
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'claw', 'prone', 'fly']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'claw': 10, 'prone': 6, 'fly': 10}


def targets():
    """an ART-56 Prone page by its Prone 1 at its own view's Fall 6 (game size)"""
    cuts = AD.cut(ROOT, 'harpy', 'ART-56', PAGES, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit, idle_joined=True)
    out = {}
    for v, (fa, pr) in FALL.items():
        last = (cuts[fa].get('hurt_b') or cuts[fa]['hurt'])[-1][0]
        out[pr] = ('prone', 0, AD.tall(fit(last, K[fa])))
    print('  targets: ' + ', '.join('%s %d' % (L, t[2]) for L, t in sorted(out.items())))
    return out


# a Fly page at its view's median scale (10-28): its first frame spreads the wings flat and stands short, so the cutter's rule (that frame
# against Idle 1) blew it up; the art desk draws a view's pages at much the same scale, so the median of the view's other pages
FLY_PAGES = ('H3P3', 'H4P3', 'H5P3')
_scales0 = AD.scales
def _scales(cuts, views, *a, **k):
    K = _scales0(cuts, views, *a, **k)
    for v, ls in views.items():
        rest = sorted(K[L] for L in ls if L not in FLY_PAGES)
        for L in ls:
            if L in FLY_PAGES:
                K[L] = float(np.median(rest))
    return K
AD.scales = _scales

# S's Fly page draws its eight in four lines, smaller than S's other pages: at the view's median it flew two thirds the size of the rest.
# It takes N's size instead (the same flight from in front and from behind): its frames' median width and height against N's, their geometric mean (10-28)
_scales1 = AD.scales
def _scales_s(cuts, views, *a, **k):
    K = _scales1(cuts, views, *a, **k)
    if 'H3P3' in K and 'H5P3' in K:
        ext = lambda L, rows, ax: float(np.median([(lambda f: np.ptp(np.where(f[..., 3].any(ax))[0]) + 1)(fit(im, K[L])) for r in rows for im, _, _ in cuts[L].get(r, [])]))
        S4, N2 = ('fly', 'fly_b', 'fly_c', 'fly_d'), ('fly', 'fly_b')
        K['H3P3'] *= ((ext('H3P3', S4, 0) / ext('H5P3', N2, 0)) * (ext('H3P3', S4, 1) / ext('H5P3', N2, 1))) ** 0.5   # (the geometric mean of the width's and the height's: S spreads its wings flat, N raises them)
    return K
AD.scales = _scales_s

def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the wings above and the legs below spread wide)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 75 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build():
    tg = targets()
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, joins=JOINS, targets=tg, idle_joined=True)
    first = AD.views(ROOT, 'harpy', 'ART-56', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'harpy', 'ART-56', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
    d = {v: dict(rows, prone=rows['prone'][::-1]) for v, rows in d.items()}
    frames = {}
    for an in ROWS:
        frames[an] = [d['S'][an], mirror(d['SE'][an]), mirror(d['E'][an]), mirror(d['NE'][an]), d['N'][an], d['NE'][an], d['E'][an], d['SE'][an]]
        if len({len(fs) for fs in frames[an]}) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (an, [len(fs) for fs in frames[an]]))
    return frames


if __name__ == '__main__':
    frames = build()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for an, fps in FPS.items():
        meta['anims'][an]['fps'] = fps
    meta['source'] = 'drawn by the art desk (ART-14 SE and NE with its two Claws corrections, 10-10; ART-56 S, E and N, 10-20), cut by tools/harpy-sheet.py through tools/artdesk.py (10-28)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
