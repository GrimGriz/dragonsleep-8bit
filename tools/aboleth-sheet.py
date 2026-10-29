"""DEEP16 pipeline 2 (generated art): the art desk's aboleth pages -> aboleth_p1, a creature new to the grid (10-22, the monster cutter seat's
third run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all tueday").

    python tools/aboleth-sheet.py            # deep16/art/aboleth_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/aboleth/ART-19/ -- a worktree reads them there): ART-19 (10-21, sorted out of
Fresh by _src/art-desk/sort-delivery.py), all five views, one action a page on two printed bands (Flinch and Prone on one): HEAD 1 SE (its
page 1 an identity sheet, not cut), HEAD 2 NE, HEAD 3 S, HEAD 4 E, HEAD 5 N; Idle 6, Swim 8, Tentacles 6, Tail 6, Enslave 6, Flinch 4, Fall 6,
Prone 2.
What each became: idle, walk <- Swim (bound to the water, it moves by swimming), tentacles <- Tentacles (its Multiattack's three; the grick's
row name, played once), tail <- Tail (its legendary Tail Swipe), flinch, hurt <- Fall (played once), prone <- Prone played backwards.
enslave <- Enslave (10-28, his "Yes, cut them": js/monsterrules.js plays its own enslave row) -- the body and its lit eyes, the drawn
psychic rings left out (they overlap the next frames and run past the cell; the engine rings it in violet as it enslaves, FX.ring). Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE.
The boxes by the seat's draft (each page's bodies clustered into the manifest's printed bands, each frame's x its body's middle, each strip
from 30 px over the highest foot), on a mask by channel (CHAN: its dark teal is not grey -- by the grey test its bodies fell to pieces); each band's top-left corner
(260 px in, down to its highest body) boxed as label -- its grey labels.
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 56 px from every side -- the art desk's turnaround stands even (front
462, sides 481 and 487, back 479 px, one page); a Large swimmer, near the manticore's 58. A later page by its first frame against its view's
Idle 1 (every Idle frame counted), a Fall page by its Fall 1, a Prone page by its Prone 1 at its own view's Fall 6. Two passes: the second tones
every page per channel to its own view's first-pass idle, the others to the E's.
ART-118 (10-28, the art desk's best-of for the Fall and Prone pages, PARTIAL): seven rows taken (ADOPT below), built in a second pass with its
own colour rule and laid over the first, every other row the first pass's byte for byte.
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

NAME = 'aboleth_p1'
FW, FH, AX, AY = 152, 88, 76, 76             # (its tentacles and tail 74 px each side, a raised tentacle 74 up; 88 tall since ART-118's E Fall, whose third frame hangs its tentacles 11 below the anchor, the anchor where it was)
STAND = {'side': 56, 'S': 56, 'N': 56}

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC = {
  'H1P2': (dict(file='ART-19_HEAD-1_PAGE-2.png', W=1536, text=[(0, 0, 260, 25), (0, 512, 260, 512)]),
           R(('idle', (0, 0, 1536, 511), (406, 511), 3, [266, 765, 1258]), ('idle_b', (0, 512, 1536, 1021), (884, 1021), 3, [269, 766, 1253]))),
  'H1P3': (dict(file='ART-19_HEAD-1_PAGE-3.png', W=1536, text=[(0, 0, 260, 61), (0, 535, 260, 535)]),
           R(('walk', (0, 0, 1536, 534), (373, 534), 4, [202, 565, 942, 1325]), ('walk_b', (0, 535, 1536, 1021), (872, 1021), 4, [209, 598, 947, 1327]))),
  'H1P4': (dict(file='ART-19_HEAD-1_PAGE-4.png', W=1536, text=[(0, 0, 260, 19), (0, 502, 260, 502), (214, 821, 226, 844), (477, 835, 488, 858)]),
           R(('tentacles', (0, 0, 1536, 501), (392, 501), 3, [271, 738, 1244]), ('tentacles_b', (0, 502, 1536, 1021), (795, 1021), 3, [274, 762, 1228]))),
  'H1P5': (dict(file='ART-19_HEAD-1_PAGE-5.png', W=1536, text=[(0, 0, 260, 23), (0, 512, 260, 512)]),
           R(('tail', (0, 0, 1536, 511), (427, 511), 3, [261, 768, 1243]), ('tail_b', (0, 512, 1536, 1021), (875, 1021), 3, [262, 745, 1238]))),
  'H1P7': (dict(file='ART-19_HEAD-1_PAGE-7.png', W=1536, text=[(0, 0, 260, 10), (0, 498, 260, 498), (251, 734, 278, 761), (284, 831, 301, 860), (334, 884, 349, 905), (581, 864, 603, 898), (629, 712, 646, 733), (691, 771, 722, 800), (692, 700, 709, 722), (972, 290, 1026, 316), (1015, 345, 1064, 379), (1213, 130, 1273, 227), (1282, 374, 1305, 397), (1300, 119, 1342, 149), (1331, 273, 1346, 286), (1345, 169, 1376, 198), (1345, 248, 1376, 284), (1353, 368, 1388, 393), (1361, 220, 1376, 242)]),
           R(('flinch', (0, 0, 1536, 497), (411, 497), 2, [444, 1141]), ('flinch_b', (0, 498, 1536, 1021), (897, 1021), 2, [431, 1161]))),
  'H1P8': (dict(file='ART-19_HEAD-1_PAGE-8.png', W=1536, text=[(0, 0, 260, 54), (0, 572, 260, 572)]),
           R(('hurt', (0, 0, 1536, 571), (445, 571), 3, [265, 754, 1239]), ('hurt_b', (0, 572, 1536, 1021), (853, 1021), 3, [272, 765, 1250]))),
  'H1P9': (dict(file='ART-19_HEAD-1_PAGE-9.png', W=1536, text=[(0, 0, 260, 19), (0, 478, 260, 478)]),
           R(('prone', (0, 0, 1536, 477), (441, 477), 1, [756]), ('prone_b', (0, 478, 1536, 1021), (937, 1021), 1, [750]))),
  'H2P1': (dict(file='ART-19_HEAD-2_PAGE-1.png', W=1536, text=[(0, 0, 260, 63), (0, 533, 260, 533)]),
           R(('idle', (0, 0, 1536, 532), (417, 532), 3, [339, 808, 1313]), ('idle_b', (0, 533, 1536, 1021), (897, 1021), 3, [340, 805, 1297]))),
  'H2P2': (dict(file='ART-19_HEAD-2_PAGE-2.png', W=1536, text=[(0, 0, 260, 65), (0, 532, 260, 532)]),
           R(('walk', (0, 0, 1536, 531), (382, 531), 4, [234, 624, 1004, 1380]), ('walk_b', (0, 532, 1536, 1021), (869, 1021), 4, [224, 620, 997, 1369]))),
  'H2P3': (dict(file='ART-19_HEAD-2_PAGE-3.png', W=1536, text=[(0, 0, 260, 31), (0, 528, 260, 528)]),
           R(('tentacles', (0, 0, 1536, 527), (421, 527), 3, [268, 752, 1241]), ('tentacles_b', (0, 528, 1536, 1021), (890, 1021), 3, [285, 755, 1234]))),
  'H2P4': (dict(file='ART-19_HEAD-2_PAGE-4.png', W=1536, text=[(0, 0, 260, 50), (0, 506, 260, 506)]),
           R(('tail', (0, 0, 1536, 505), (318, 505), 3, [311, 811, 1267]), ('tail_b', (0, 506, 1536, 1021), (832, 1021), 3, [318, 788, 1245]))),
  'H2P6': (dict(file='ART-19_HEAD-2_PAGE-6.png', W=1536, text=[(0, 0, 260, 34), (0, 530, 260, 530), (1118, 73, 1163, 96), (1251, 77, 1267, 96), (1359, 296, 1374, 320), (1394, 232, 1411, 254)]),
           R(('flinch', (0, 0, 1536, 529), (440, 529), 2, [444, 1131]), ('flinch_b', (0, 530, 1536, 1021), (920, 1021), 2, [441, 1131]))),
  'H2P7': (dict(file='ART-19_HEAD-2_PAGE-7.png', W=1536, text=[(0, 0, 260, 74), (0, 571, 260, 571)]),
           R(('hurt', (0, 0, 1536, 570), (389, 570), 3, [314, 815, 1330]), ('hurt_b', (0, 571, 1536, 1021), (840, 1021), 3, [316, 822, 1315]))),
  'H2P8': (dict(file='ART-19_HEAD-2_PAGE-8.png', W=1536, text=[(0, 0, 260, 67), (0, 486, 260, 486)]),
           R(('prone', (0, 0, 1536, 485), (446, 485), 1, [805]), ('prone_b', (0, 486, 1536, 1021), (943, 1021), 1, [811]))),
  'H3P1': (dict(file='ART-19_HEAD-3_PAGE-1.png', W=1536, text=[(0, 0, 260, 19), (0, 504, 260, 504)]),
           R(('idle', (0, 0, 1536, 503), (413, 503), 3, [311, 780, 1267]), ('idle_b', (0, 504, 1536, 1021), (895, 1021), 3, [314, 787, 1271]))),
  'H3P2': (dict(file='ART-19_HEAD-3_PAGE-2.png', W=1536, text=[(0, 0, 260, 23), (0, 510, 260, 510)]),
           R(('walk', (0, 0, 1536, 509), (361, 509), 4, [256, 633, 980, 1348]), ('walk_b', (0, 510, 1536, 1021), (830, 1021), 4, [228, 606, 989, 1344]))),
  'H3P3': (dict(file='ART-19_HEAD-3_PAGE-3.png', W=1536, text=[(0, 0, 260, 21), (0, 508, 260, 508)]),
           R(('tentacles', (0, 0, 1536, 507), (414, 507), 3, [271, 738, 1277]), ('tentacles_b', (0, 508, 1536, 1021), (859, 1021), 3, [230, 787, 1310]))),
  'H3P4': (dict(file='ART-19_HEAD-3_PAGE-4.png', W=1536, text=[(0, 0, 260, 17), (0, 496, 260, 496)]),
           R(('tail', (0, 0, 1536, 495), (420, 495), 3, [310, 782, 1247]), ('tail_b', (0, 496, 1536, 1021), (897, 1021), 3, [368, 818, 1234]))),
  'H3P6': (dict(file='ART-19_HEAD-3_PAGE-6.png', W=2172, text=[(0, 0, 260, 101), (608, 367, 636, 392), (611, 466, 640, 510), (626, 555, 645, 586), (627, 293, 648, 319), (631, 354, 661, 376), (632, 296, 658, 336), (653, 413, 683, 437), (661, 385, 689, 420), (685, 276, 722, 294), (689, 372, 728, 430), (700, 580, 728, 612), (706, 255, 734, 298), (724, 549, 770, 591), (759, 313, 777, 334), (940, 565, 967, 590), (953, 256, 1001, 300), (980, 402, 1005, 431), (991, 455, 1075, 527), (1122, 404, 1151, 429), (1153, 592, 1179, 625), (1159, 415, 1180, 446), (1214, 300, 1259, 323), (1272, 316, 1293, 338), (1504, 334, 1555, 355), (1578, 458, 1599, 486), (1578, 575, 1599, 604)]),
           R(('flinch', (0, 0, 2172, 721), (559, 721), 4, [303, 850, 1379, 1910]))),
  'H3P7': (dict(file='ART-19_HEAD-3_PAGE-7.png', W=1536, text=[(0, 0, 260, 24), (0, 562, 260, 562)]),
           R(('hurt', (0, 0, 1536, 561), (424, 561), 3, [267, 767, 1275]), ('hurt_b', (0, 562, 1536, 1021), (861, 1021), 3, [248, 739, 1250]))),
  'H3P8': (dict(file='ART-19_HEAD-3_PAGE-8.png', W=1536, text=[(0, 0, 260, 8), (0, 496, 260, 496)]),
           R(('prone', (0, 0, 1536, 495), (456, 495), 1, [740]), ('prone_b', (0, 496, 1536, 1021), (922, 1021), 1, [770]))),
  'H4P1': (dict(file='ART-19_HEAD-4_PAGE-1.png', W=1536, text=[(0, 0, 260, 106), (0, 541, 260, 541)]),
           R(('idle', (0, 0, 1536, 540), (371, 540), 3, [299, 794, 1294]), ('idle_b', (0, 541, 1536, 1021), (805, 1021), 3, [298, 779, 1282]))),
  'H4P2': (dict(file='ART-19_HEAD-4_PAGE-2.png', W=1536, text=[(0, 0, 260, 105), (0, 565, 260, 565)]),
           R(('walk', (0, 0, 1536, 564), (360, 564), 4, [242, 619, 1007, 1373]), ('walk_b', (0, 565, 1536, 1021), (805, 1021), 4, [229, 610, 996, 1375]))),
  'H4P3': (dict(file='ART-19_HEAD-4_PAGE-3.png', W=1536, text=[(0, 0, 260, 105), (0, 548, 260, 548), (496, 750, 519, 771), (508, 831, 522, 850), (527, 692, 541, 710), (527, 764, 539, 778), (915, 561, 939, 581), (938, 789, 956, 810), (955, 584, 969, 597), (982, 585, 1004, 610), (989, 827, 1006, 846), (994, 729, 1034, 764), (1022, 833, 1032, 842), (1038, 732, 1052, 750), (1421, 354, 1451, 374), (1485, 304, 1504, 322), (1497, 384, 1511, 403), (1509, 245, 1522, 263)]),
           R(('tentacles', (0, 0, 1536, 547), (356, 547), 3, [264, 764, 1266]), ('tentacles_b', (0, 548, 1536, 1021), (789, 1021), 3, [285, 788, 1287]))),
  'H4P4': (dict(file='ART-19_HEAD-4_PAGE-4.png', W=1536, text=[(0, 0, 260, 83), (0, 552, 260, 552)]),
           R(('tail', (0, 0, 1536, 551), (372, 551), 3, [300, 783, 1299]), ('tail_b', (0, 552, 1536, 1021), (830, 1021), 3, [298, 784, 1297]))),
  'H4P6': (dict(file='ART-19_HEAD-4_PAGE-6.png', W=1536, text=[(0, 0, 260, 90), (0, 547, 260, 547), (590, 792, 608, 814), (596, 222, 609, 233), (609, 274, 653, 299), (613, 222, 666, 247), (631, 177, 654, 198), (633, 781, 649, 799), (690, 313, 718, 339), (967, 321, 999, 349), (1108, 377, 1125, 406), (1386, 274, 1460, 301), (1434, 191, 1461, 210)]),
           R(('flinch', (0, 0, 1536, 546), (401, 546), 2, [371, 1161]), ('flinch_b', (0, 547, 1536, 1021), (849, 1021), 2, [378, 1175]))),
  'H4P7': (dict(file='ART-19_HEAD-4_PAGE-7.png', W=1536, text=[(0, 0, 260, 96), (0, 582, 260, 582)]),
           R(('hurt', (0, 0, 1536, 581), (364, 581), 3, [298, 786, 1268]), ('hurt_b', (0, 582, 1536, 1021), (849, 1021), 3, [277, 757, 1274]))),
  'H4P8': (dict(file='ART-19_HEAD-4_PAGE-8.png', W=1536, text=[(0, 0, 260, 34), (0, 502, 260, 502)]),
           R(('prone', (0, 0, 1536, 501), (411, 501), 1, [853]), ('prone_b', (0, 502, 1536, 1021), (936, 1021), 1, [847]))),
  'H5P1': (dict(file='ART-19_HEAD-5_PAGE-1.png', W=1536, text=[(0, 0, 260, 53), (0, 515, 260, 515)]),
           R(('idle', (0, 0, 1536, 514), (374, 514), 3, [332, 803, 1270]), ('idle_b', (0, 515, 1536, 1021), (843, 1021), 3, [338, 821, 1254]))),
  'H5P2': (dict(file='ART-19_HEAD-5_PAGE-2.png', W=1536, text=[(0, 0, 260, 50), (0, 532, 260, 532)]),
           R(('walk', (0, 0, 1536, 531), (386, 531), 4, [204, 574, 952, 1332]), ('walk_b', (0, 532, 1536, 1021), (867, 1021), 4, [210, 581, 965, 1339]))),
  'H5P3': (dict(file='ART-19_HEAD-5_PAGE-3.png', W=1536, text=[(0, 0, 260, 8), (0, 528, 260, 528), (336, 601, 349, 614), (358, 603, 385, 640), (453, 571, 475, 586), (458, 602, 474, 618), (477, 566, 491, 580), (489, 596, 502, 610), (749, 77, 802, 138), (795, 38, 821, 84), (1119, 71, 1147, 90), (1208, 14, 1232, 41), (1211, 109, 1226, 138), (1316, 84, 1353, 101), (1352, 110, 1366, 138), (1421, 24, 1434, 36), (1421, 51, 1456, 85), (1449, 19, 1462, 31), (1454, 78, 1469, 93), (1460, 49, 1473, 62)]),
           R(('tentacles', (0, 0, 1536, 527), (423, 527), 3, [271, 769, 1273]), ('tentacles_b', (0, 528, 1536, 1021), (913, 1021), 3, [284, 778, 1296]))),
  'H5P4': (dict(file='ART-19_HEAD-5_PAGE-4.png', W=1536, text=[(0, 0, 260, 19), (0, 495, 260, 495)]),
           R(('tail', (0, 0, 1536, 494), (351, 494), 3, [313, 784, 1261]), ('tail_b', (0, 495, 1536, 1021), (836, 1021), 3, [341, 777, 1237]))),
  'H5P6': (dict(file='ART-19_HEAD-5_PAGE-6.png', W=1536, text=[(0, 0, 260, 28), (0, 524, 260, 524)]),
           R(('flinch', (0, 0, 1536, 523), (409, 523), 2, [461, 1132]), ('flinch_b', (0, 524, 1536, 1021), (902, 1021), 2, [469, 1138]))),
  'H5P7': (dict(file='ART-19_HEAD-5_PAGE-7.png', W=1536, text=[(0, 0, 260, 47), (0, 534, 260, 534)]),
           R(('hurt', (0, 0, 1536, 533), (399, 533), 3, [289, 761, 1243]), ('hurt_b', (0, 534, 1536, 1021), (828, 1021), 3, [281, 726, 1233]))),
  'H5P8': (dict(file='ART-19_HEAD-5_PAGE-8.png', W=1536, text=[(0, 0, 260, 49), (0, 529, 260, 529)]),
           R(('prone', (0, 0, 1536, 528), (450, 528), 1, [749]), ('prone_b', (0, 529, 1536, 1021), (963, 1021), 1, [765]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC.items()}
# the Enslave pages (10-28): two lines of three, the bands to each line's numbers; each frame's psychic rings out (_ENSLAVE below)
ENSLAVEP = {'H1P6': ('ART-19_HEAD-1_PAGE-6.png', [(0, 0, 1536, 468), (439, 468), [235, 765, 1293]], [(0, 469, 1536, 971), (930, 971), [258, 770, 1262]], []),
            'H2P5': ('ART-19_HEAD-2_PAGE-5.png', [(0, 0, 1536, 445), (415, 445), [309, 763, 1276]], [(0, 446, 1536, 957), (925, 957), [338, 804, 1247]], [(15, 170, 165, 205), (15, 645, 165, 682)]),
            'H3P5': ('ART-19_HEAD-3_PAGE-5.png', [(0, 0, 1536, 464), (433, 464), [341, 784, 1261]], [(0, 465, 1536, 990), (959, 990), [348, 809, 1289]], [(15, 158, 125, 202), (15, 578, 125, 622)]),
            'H4P5': ('ART-19_HEAD-4_PAGE-5.png', [(0, 0, 1536, 463), (430, 463), [267, 802, 1305]], [(0, 464, 1536, 918), (885, 918), [327, 816, 1275]], [(15, 395, 160, 430), (15, 855, 160, 890)]),
            'H5P5': ('ART-19_HEAD-5_PAGE-5.png', [(0, 0, 1536, 459), (431, 459), [328, 788, 1226]], [(0, 460, 1536, 962), (933, 962), [341, 772, 1233]], [(35, 45, 180, 80), (35, 510, 180, 548)])}
for _L, (_f, _a, _b, _t) in ENSLAVEP.items():
    PAGES[_L] = dict(file=_f, W=1536, text=_t, rows=[('enslave', _a[0], _a[1], 3), ('enslave_b', _b[0], _b[1], 3)], xs={'enslave': _a[2], 'enslave_b': _b[2]})
# three labels the corner boxes miss (NE Idle's beside its first body's raised tip, S Fall's second line low in the first's strip, N Tentacles'
# band set high by a raised tentacle): boxed by hand
for _L, _b in {'H2P1': (40, 50, 112, 82), 'H3P7': (25, 520, 112, 578), 'H5P3': (30, 36, 194, 70)}.items():
    PAGES[_L]['text'] = PAGES[_L]['text'] + [_b]
# ART-118 (10-28, the fourth cutter seat, on Griz's "fresh in fresh for the cutter"): the art desk's best-of for the Fall and Prone pages, in
# _src/aboleth/ART-118/ (PARTIAL by its own word, his "wrap up the best off - this is a rare encounter and not worth too much burn"), each keyed
# by the ART-19 page it would replace; a row taken only where it mends what the grid shows (ADOPT). Each page prints its row's name at a band's
# left (beside its numbers, or at its top) and the numbers under the drawings, all in one blue-white: every word and digit boxed on its own
# (`own_strip`). Its Prone pages draw 1 down and 2 risen, as ART-19's did, so the row is still played backwards: the engine lies on a prone row's
# last frame (js/sprites.js proneFrame). Its belly and tentacles are drawn a hotter coral than ART-19's brown-orange -- the same hue, about 10
# degrees, but saturation 0.72 against 0.56 and value 0.79 against 0.66 (the warm pixels' medians, page to page) -- and snapped to the reds, a
# fifth of a Fall row where the idle's are the skin ramp's oranges: each ART-118 cut's warm pixels toned to ART-19's before the snap (WARM118)
def _n118(file, W, H, names, *bands):
    """a page of ART-118 (W x H): names, the boxes of its row names; bands (row, (top, bottom) of the band, (top, bottom) of its digits,
    [(x0, x1) a digit])"""
    text, rows, xs = [(x0 - 5, y0 - 5, x1 + 5, y1 + 5) for x0, y0, x1, y1 in names], [], {}
    for r, (b0, b1), (d0, d1), ds in bands:
        text += [(x0 - 5, d0 - 5, x1 + 5, d1 + 5) for x0, x1 in ds]
        rows.append((r, (0, b0, W, b1), (d0, b1), len(ds))); xs[r] = [(x0 + x1) // 2 for x0, x1 in ds]
    return dict(dir='ART-118', file=file, W=W, text=text, rows=rows, xs=xs, own_strip=[b[0] for b in bands])
NEW118 = {
  'H1P8': _n118('ART-118_HEAD-1_PAGE-2.png', 1536, 1024, [(31, 453, 100, 485), (31, 904, 100, 943)],
                ('hurt', (0, 490), (453, 485), [(267, 288), (760, 783), (1261, 1285)]), ('hurt_b', (491, 1024), (904, 943), [(266, 290), (758, 781), (1262, 1286)])),
  'H1P9': _n118('ART-118_HEAD-1_PAGE-3.png', 1956, 804, [(51, 697, 186, 735)], ('prone', (0, 804), (697, 735), [(496, 523), (1486, 1515)])),
  'H2P7': _n118('ART-118_HEAD-2_PAGE-1.png', 1536, 1024, [(40, 56, 110, 87), (42, 540, 110, 571)],
                ('hurt', (0, 471), (436, 467), [(263, 284), (761, 785), (1267, 1290)]), ('hurt_b', (472, 1024), (899, 930), [(261, 286), (761, 785), (1267, 1290)])),
  'H2P8': _n118('ART-118_HEAD-2_PAGE-2.png', 1774, 887, [(100, 148, 253, 190)], ('prone', (0, 887), (693, 732), [(470, 498), (1312, 1343)])),
  'H3P7': _n118('ART-118_HEAD-3_PAGE-1.png', 1536, 1024, [(37, 57, 113, 94)],
                ('hurt', (0, 495), (458, 491), [(273, 293), (755, 779), (1272, 1295)]), ('hurt_b', (496, 1024), (936, 969), [(260, 287), (755, 779), (1267, 1291)])),
  'H3P8': _n118('ART-118_HEAD-3_PAGE-2.png', 1774, 887, [(67, 108, 209, 149)], ('prone', (0, 887), (770, 812), [(432, 462), (1307, 1340)])),
  'H4P7': _n118('ART-118_HEAD-4_PAGE-1.png', 1536, 1024, [(30, 467, 93, 500), (26, 882, 89, 928)],
                ('hurt', (0, 504), (467, 500), [(252, 271), (757, 780), (1260, 1282)]), ('hurt_b', (505, 1024), (882, 928), [(252, 276), (759, 781), (1259, 1282)])),
  'H4P8': _n118('ART-118_HEAD-4_PAGE-2.png', 2172, 724, [(39, 613, 170, 662)], ('prone', (0, 724), (613, 662), [(531, 557), (1614, 1642)])),
  'H5P7': _n118('ART-118_HEAD-5_PAGE-1.png', 1536, 1024, [(37, 472, 109, 506), (37, 885, 109, 916)],
                ('hurt', (0, 510), (472, 506), [(279, 296), (758, 781), (1265, 1287)]), ('hurt_b', (511, 1024), (885, 916), [(271, 294), (757, 780), (1265, 1287)])),
  'H5P8': _n118('ART-118_HEAD-5_PAGE-2.png', 1774, 887, [(69, 756, 205, 802)], ('prone', (0, 887), (756, 802), [(534, 560), (1345, 1375)])),
}
WARM118 = (0.56 / 0.72, 0.66 / 0.79)          # (saturation, value) of the warm pixels, ART-19's over ART-118's
# (view, row) -> the ART-19 page whose ART-118 page plays there now; SW, W and NW follow as their mirrors. Taken: SE and NE Fall (the belly
# rolls up, the size held near the idle's, where ART-19's shrank), E Fall, and the Prone of SE, NE, S and E (ART-19's small and grey beside
# their idles, a printed digit beside every frame). Passed over: S Fall (it stays upright to its last frame: no death reads), N Fall (it turns
# to profile as ART-19's does, no better) and N Prone (a third of its idle's size)
ADOPT = {('SE', 'hurt'): 'H1P8', ('SE', 'prone'): 'H1P9', ('NE', 'hurt'): 'H2P7', ('NE', 'prone'): 'H2P8', ('S', 'prone'): 'H3P8',
         ('E', 'hurt'): 'H4P7', ('E', 'prone'): 'H4P8'}
FIX, CUTS = {}, {}
# an Enslave frame's psychic rings out: violet and lavender light (blue over green, red over green) and the rings' dark edges, outside the
# body's own filled silhouette (across it they stay, glow on it); then the body alone -- its biggest piece and any piece a quarter of it
from scipy import ndimage as _nd
def _no_rings(im):
    a = np.asarray(im).astype(np.int32).copy()
    al = a[..., 3] > 0
    ring = (((a[..., 2] - a[..., 1]) > 45) & ((a[..., 0] - a[..., 1]) > 5)) | (((a[..., 2] - a[..., 1]) > 20) & ((a[..., 0] - a[..., 1]) > -5) & (a[..., :3].mean(-1) < 110))
    body = _nd.binary_fill_holes(_nd.binary_closing(al & ~ring, structure=np.ones((3, 3)), iterations=6))   # (the body's own silhouette: ring light across it stays, as glow on it)
    a[al & ring & ~body, 3] = 0
    lab, n = _nd.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    if n > 1:
        sz = _nd.sum(a[..., 3] > 0, lab, range(1, n + 1))
        a[~np.isin(lab, 1 + np.where(sz >= 0.25 * sz.max())[0]), 3] = 0
    return Image.fromarray(a.astype(np.uint8), 'RGBA')
def _warm(im, ks, kv):
    """an ART-118 cut's warm pixels (hue within 40 degrees of red, saturation over 0.35, value over 0.3) toned: saturation times ks (each
    channel drawn toward the brightest), then value times kv; the hue stays"""
    a = np.asarray(im).astype(float); c = a[..., :3] / 255.0
    mx, mn = c.max(-1), c.min(-1); d = mx - mn; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(d > 1e-6, np.where(mx == r, ((g - b) / np.maximum(d, 1e-6)) % 6, 9), 9) * 60     # (red the brightest: its hue; else out)
    w = ((h < 40) | (h > 320)) & (s > 0.35) & (mx > 0.3)
    c2 = (mx[..., None] - (mx[..., None] - c) * ks) * kv
    a[..., :3] = np.where(w[..., None], np.clip(c2, 0, 1) * 255.0, a[..., :3])
    return Image.fromarray(np.round(a).astype(np.uint8), 'RGBA')
_cut0 = AD.cut
def _cut(*a, **k):
    out = _cut0(*a, **k)
    pages = a[3] if len(a) > 3 else k.get('pages', {})
    for L, rows in out.items():
        for r in rows:
            if r.startswith('enslave'):
                rows[r] = [(None if im is None else _no_rings(im), box, x) for im, box, x in rows[r]]
            if pages.get(L, {}).get('dir') == 'ART-118':
                rows[r] = [(None if im is None else _warm(im, *WARM118), box, x) for im, box, x in rows[r]]
    return out
AD.cut = _cut
CHAN = 28                                      # (its dark teal falls out of the grey test: each channel against the navy, the ettercap's way)
# each view's pages, its Idle's first; Enslave last (H1 P6, the others' P5: cut since 10-28)
VIEWS = {'SE': ('H1P2', 'H1P3', 'H1P4', 'H1P5', 'H1P7', 'H1P8', 'H1P9', 'H1P6')}
VIEWS.update({v: tuple('H%dP%d' % (h, p) for p in (1, 2, 3, 4, 6, 7, 8, 5)) for v, h in (('NE', 2), ('S', 3), ('E', 4), ('N', 5))})
FALL = {'SE': ('H1P8', 'H1P9'), 'NE': ('H2P7', 'H2P8'), 'S': ('H3P7', 'H3P8'), 'E': ('H4P7', 'H4P8'), 'N': ('H5P7', 'H5P8')}   # (Fall page, Prone page)
STAND_OF = {}
JOINS = {r + '_b': r for r in ('idle', 'walk', 'tentacles', 'tail', 'flinch', 'hurt', 'prone', 'enslave')}
ROWS = ['idle', 'walk', 'hurt', 'flinch', 'tentacles', 'prone', 'tail', 'enslave']
FPS = {'idle': 6, 'walk': 8, 'hurt': 8, 'flinch': 10, 'tentacles': 10, 'prone': 6, 'tail': 10, 'enslave': 8}


def targets(pages=PAGES):
    """the Prone page by its Prone 1 at its own view's Fall 6 (game size)"""
    cuts = AD.cut(ROOT, 'aboleth', 'ART-19', pages, chan=CHAN, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit, stand_of=STAND_OF, idle_joined=True)
    def last(L, r):
        return (cuts[L].get(r + '_b') or cuts[L][r])[-1][0]
    out = {}
    for v, (fa, pr) in FALL.items():
        out[pr] = ('prone', 0, AD.tall(fit(last(fa, 'hurt'), K[fa])))
    print('  targets: ' + ', '.join('%s %d' % (L, t[2]) for L, t in sorted(out.items())))
    return out


def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the tentacles below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 80 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def views(pages):
    tg = targets(pages)
    cell = (FW, FH, AX, AY)
    kw = dict(chan=CHAN, fix=FIX, cuts=CUTS, stand_of=STAND_OF, joins=JOINS, targets=tg, idle_joined=True)   # (every Idle frame to its median: N's first line raises its wings in two of three)
    first = AD.views(ROOT, 'aboleth', 'ART-19', pages, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'aboleth', 'ART-19', pages, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
    return {v: dict(rows, prone=rows['prone'][::-1]) for v, rows in d.items()}


def build(adopt=None):
    """built on ART-19 alone, then again with every ART-118 page in place of its own (each new Prone sized by its own new Fall's Fall 6, taken
    or not), and only ADOPT's rows taken from the second: every row not adopted is the first build's, byte for byte"""
    adopt = ADOPT if adopt is None else adopt
    d = views(PAGES)
    if adopt:
        d2 = views(dict(PAGES, **NEW118))
        for (v, an) in adopt:
            d[v][an] = d2[v][an]
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
    meta['source'] = 'drawn by the art desk (ART-19, all five views, 10-21; its ART-118 best-of for %s, 10-28), cut by tools/aboleth-sheet.py through tools/artdesk.py (10-22)' % ', '.join('%s %s' % va for va in sorted(ADOPT))
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
