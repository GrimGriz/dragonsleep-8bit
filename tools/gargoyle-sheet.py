"""DEEP16 pipeline 2 (generated art): the art desk's gargoyle pages -> gargoyle_p1, a creature new to the grid (10-22, the monster cutter seat's
third run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all tueday").

    python tools/gargoyle-sheet.py            # deep16/art/gargoyle_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/gargoyle/ART-18/ -- a worktree reads them there): ART-18 FINAL (10-21; it
supersedes the 25-page PARTIAL), all five views, one action a page: HEAD 1 SE (its page 1 an identity sheet, not cut), HEAD 2 NE, HEAD 3 S,
HEAD 4 E, HEAD 5 N; Statue 4, Wake 6, Idle 6, Walk 8, Fly 8, Bite 6, Claws 6, Flinch 4, Fall 6, Prone 2. The pages' names carry their action
(ART-18_HEAD-2_PAGE-06_Bite.png): copied out of the received folder by the seat, each sha256 checked against the manifest.
What each became: still <- Statue (its False Appearance: it stands so till its first turn or a wound, js/ui.js; the roper's way), reveal <-
Wake (played as it wakes, js/ai.js), idle, walk, attack <- Bite, claw <- Claws (both blows of its Multiattack play their own row), flinch,
hurt <- Fall (played once), prone <- Prone played backwards. Fly is NOT cut: no rule plays a fly row in a fight (it flies on its idle and
walk), as the manticore's. Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE.
The boxes by the seat's draft (each page's bodies clustered into the manifest's printed bands, each frame's x its body's middle, each strip
from 30 px over the highest foot), NE's Bite by hand (its wings touch).
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 52 px from every side -- a man-sized winged statue; the art desk's
turnaround stands even (front 406, sides 416, back 412 px, one page). A later page by its first frame against its view's Idle 1, a Wake page
by its Wake 6 (standing), the Statue page by its Statue 1 at the height of the Wake page's Wake 1 (the same crouch), a Prone page by its Prone 1
at its own view's Fall 6. Two passes: the second tones every page per channel to its own view's first-pass idle, the others to the E's.
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

NAME = 'gargoyle_p1'
FW, FH, AX, AY = 96, 72, 48, 67             # (the wings and claws 47 px each side, a raised wing 65 up)
STAND = {'side': 52, 'S': 52, 'N': 52}

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC = {
  'H1P2': (dict(file='ART-18_HEAD-1_PAGE-02_Statue.png', W=1536, text=[(575, 742, 603, 781), (954, 742, 982, 781), (1334, 742, 1363, 781)]),
           R(('still', (0, 0, 1536, 1021), (680, 1021), 4, [203, 588, 966, 1356]))),
  'H1P3': (dict(file='ART-18_HEAD-1_PAGE-03_Wake.png', W=1536, text=[(28, 228, 157, 271), (296, 923, 323, 957), (336, 442, 355, 475), (788, 441, 812, 475), (788, 923, 812, 957), (1256, 442, 1281, 475), (1268, 923, 1293, 957)]),
           R(('reveal', (0, 0, 1536, 498), (400, 498), 3, [350, 792, 1246]), ('reveal_b', (0, 499, 1536, 1021), (873, 1021), 3, [294, 788, 1284]))),
  'H1P4': (dict(file='ART-18_HEAD-1_PAGE-04_Idle.png', W=1536, text=[(31, 461, 114, 498), (342, 929, 367, 961), (346, 454, 367, 486), (806, 454, 829, 486), (806, 928, 829, 961), (1280, 454, 1303, 486), (1280, 929, 1303, 961)]),
           R(('idle', (0, 0, 1536, 529), (413, 529), 3, [343, 802, 1278]), ('idle_b', (0, 530, 1536, 1021), (885, 1021), 3, [322, 804, 1263]))),
  'H1P5': (dict(file='ART-18_HEAD-1_PAGE-05_Walk.png', W=1536, text=[(19, 250, 118, 287), (271, 902, 293, 936), (272, 462, 291, 496), (625, 462, 647, 496), (625, 902, 647, 936), (955, 462, 977, 496), (955, 902, 978, 936), (1311, 462, 1336, 496), (1312, 902, 1334, 936)]),
           R(('walk', (0, 0, 1536, 536), (418, 536), 4, [280, 638, 964, 1316]), ('walk_b', (0, 537, 1536, 1021), (864, 1021), 4, [263, 634, 973, 1316]))),
  'H1P7': (dict(file='ART-18_HEAD-1_PAGE-07_Bite.png', W=1536, text=[]),
           R(('attack', (0, 0, 1536, 517), (415, 517), 3, [378, 815, 1273]), ('attack_b', (0, 518, 1536, 1021), (881, 1021), 3, [335, 814, 1270]))),
  'H1P8': (dict(file='ART-18_HEAD-1_PAGE-08_Claws.png', W=1536, text=[(31, 427, 161, 467), (345, 899, 372, 934), (360, 443, 379, 477), (773, 443, 799, 477), (819, 899, 844, 934), (1228, 443, 1252, 477), (1246, 899, 1272, 934)]),
           R(('claw', (0, 0, 1536, 504), (406, 504), 3, [350, 775, 1228]), ('claw_b', (0, 505, 1536, 1021), (857, 1021), 3, [333, 812, 1250]))),
  'H1P9': (dict(file='ART-18_HEAD-1_PAGE-09_Flinch.png', W=1774, text=[(30, 435, 184, 480), (376, 690, 400, 732), (739, 689, 768, 732), (1133, 690, 1163, 732), (1541, 689, 1574, 732)]),
           R(('flinch', (0, 0, 1774, 884), (639, 884), 4, [386, 754, 1138, 1550]))),
  'H1P10': (dict(file='ART-18_HEAD-1_PAGE-10_Fall.png', W=1536, text=[(15, 255, 92, 293), (272, 928, 302, 968), (312, 493, 334, 531), (772, 493, 799, 531), (776, 928, 803, 968), (1254, 493, 1280, 531), (1254, 927, 1281, 968)]),
           R(('hurt', (0, 0, 1536, 581), (454, 581), 3, [326, 771, 1245]), ('hurt_b', (0, 582, 1536, 1021), (878, 1021), 3, [283, 774, 1263]))),
  'H1P11': (dict(file='ART-18_HEAD-1_PAGE-11_Prone.png', W=1536, text=[(19, 543, 172, 591), (457, 785, 485, 831), (1188, 785, 1219, 831)]),
           R(('prone', (0, 0, 1536, 1021), (738, 1021), 2, [493, 1217]))),
  'H2P1': (dict(file='ART-18_HEAD-2_PAGE-01_Statue.png', W=1774, text=[(38, 777, 189, 816), (257, 736, 277, 772), (664, 736, 692, 772), (1092, 736, 1119, 772), (1528, 736, 1556, 772)]),
           R(('still', (0, 0, 1774, 884), (668, 884), 4, [245, 683, 1117, 1543]))),
  'H2P2': (dict(file='ART-18_HEAD-2_PAGE-02_Wake.png', W=1774, text=[(73, 823, 101, 852), (375, 806, 404, 843), (900, 374, 928, 409), (906, 811, 933, 848), (1410, 374, 1438, 409), (1457, 811, 1484, 847)]),
           R(('reveal', (0, 0, 1774, 414), (324, 414), 3, [428, 905, 1428]), ('reveal_b', (0, 415, 1774, 884), (769, 884), 3, [355, 891, 1446]))),
  'H2P3': (dict(file='ART-18_HEAD-2_PAGE-03_Idle.png', W=1774, text=[(29, 680, 102, 714), (198, 664, 216, 696), (462, 667, 486, 698), (758, 667, 781, 698), (1047, 667, 1071, 698), (1332, 669, 1355, 700), (1615, 667, 1638, 698)]),
           R(('idle', (0, 0, 1774, 884), (592, 884), 6, [180, 480, 780, 1065, 1349, 1626]))),
  'H2P4': (dict(file='ART-18_HEAD-2_PAGE-04_Walk.png', W=1774, text=[(34, 805, 154, 843), (321, 800, 347, 833), (324, 385, 343, 417), (727, 385, 752, 417), (727, 800, 752, 833), (1141, 385, 1166, 417), (1141, 800, 1166, 833), (1555, 385, 1581, 417), (1556, 800, 1581, 833)]),
           R(('walk', (0, 0, 1774, 434), (348, 434), 4, [328, 743, 1152, 1570]), ('walk_b', (0, 435, 1774, 884), (761, 884), 4, [314, 731, 1139, 1558]))),
  'H2P7': (dict(file='ART-18_HEAD-2_PAGE-07_Claws.png', W=1774, text=[(77, 829, 102, 855), (323, 816, 351, 851), (901, 384, 928, 419), (903, 817, 930, 852), (1423, 384, 1450, 419), (1438, 817, 1466, 852)]),
           R(('claw', (0, 0, 1774, 454), (353, 454), 3, [338, 885, 1419]), ('claw_b', (0, 455, 1774, 884), (772, 884), 3, [314, 929, 1461]))),
  'H2P8': (dict(file='ART-18_HEAD-2_PAGE-08_Flinch.png', W=1774, text=[(39, 772, 184, 811), (257, 727, 279, 764), (667, 727, 696, 764), (1093, 727, 1121, 764), (1529, 727, 1558, 764)]),
           R(('flinch', (0, 0, 1774, 884), (655, 884), 4, [262, 697, 1120, 1552]))),
  'H2P9': (dict(file='ART-18_HEAD-2_PAGE-09_Fall.png', W=1774, text=[(48, 429, 123, 465), (307, 829, 335, 864), (323, 465, 343, 499), (859, 465, 886, 500), (862, 829, 887, 865), (1411, 465, 1438, 499), (1414, 829, 1441, 864)]),
           R(('hurt', (0, 0, 1774, 519), (422, 519), 3, [320, 865, 1440]), ('hurt_b', (0, 520, 1774, 884), (785, 884), 3, [319, 889, 1447]))),
  'H2P10': (dict(file='ART-18_HEAD-2_PAGE-10_Prone.png', W=1774, text=[(55, 763, 218, 810), (539, 723, 564, 767), (1350, 724, 1383, 767)]),
           R(('prone', (0, 0, 1774, 884), (661, 884), 2, [475, 1330]))),
  'H3P1': (dict(file='ART-18_HEAD-3_PAGE-01_Statue.png', W=1774, text=[(22, 454, 89, 491), (1526, 655, 1555, 695)]),
           R(('still', (0, 0, 1774, 884), (604, 884), 4, [354, 748, 1138, 1534]))),
  'H3P2': (dict(file='ART-18_HEAD-3_PAGE-02_Wake.png', W=1536, text=[(32, 303, 156, 345), (263, 923, 289, 957), (339, 453, 360, 486), (773, 923, 796, 957), (778, 453, 802, 486), (1239, 453, 1263, 486), (1240, 924, 1264, 957)]),
           R(('reveal', (0, 0, 1536, 505), (416, 505), 3, [346, 784, 1242]), ('reveal_b', (0, 506, 1536, 1021), (872, 1021), 3, [274, 785, 1259]))),
  'H3P3': (dict(file='ART-18_HEAD-3_PAGE-03_Idle.png', W=1536, text=[]),
           R(('idle', (0, 0, 1536, 501), (418, 501), 3, [282, 772, 1270]), ('idle_b', (0, 502, 1536, 1021), (905, 1021), 3, [278, 773, 1271]))),
  'H3P4': (dict(file='ART-18_HEAD-3_PAGE-04_Walk.png', W=1536, text=[(33, 314, 149, 356), (288, 933, 309, 965), (303, 451, 320, 483), (628, 933, 650, 965), (630, 451, 652, 483), (971, 933, 993, 965), (972, 451, 993, 483), (1310, 451, 1333, 483), (1319, 933, 1341, 965)]),
           R(('walk', (0, 0, 1536, 522), (409, 522), 4, [303, 645, 987, 1327]), ('walk_b', (0, 523, 1536, 1021), (887, 1021), 4, [290, 636, 974, 1335]))),
  'H3P6': (dict(file='ART-18_HEAD-3_PAGE-06_Bite.png', W=1536, text=[]),
           R(('attack', (0, 0, 1536, 482), (403, 482), 3, [261, 758, 1273]), ('attack_b', (0, 483, 1536, 1021), (846, 1021), 3, [266, 763, 1267]))),
  'H3P7': (dict(file='ART-18_HEAD-3_PAGE-07_Claws.png', W=1536, text=[(38, 21, 207, 77), (272, 437, 297, 477), (1265, 437, 1296, 477)]),
           R(('claw', (0, 0, 1536, 504), (407, 504), 3, [276, 770, 1266]), ('claw_b', (0, 505, 1536, 1021), (835, 1021), 3, [264, 784, 1269]))),
  'H3P8': (dict(file='ART-18_HEAD-3_PAGE-08_Flinch.png', W=1774, text=[(201, 664, 227, 708), (643, 664, 673, 707), (800, 747, 973, 793), (1086, 664, 1117, 708), (1536, 664, 1569, 707)]),
           R(('flinch', (0, 0, 1774, 884), (610, 884), 4, [216, 639, 1088, 1545]))),
  'H3P9': (dict(file='ART-18_HEAD-3_PAGE-09_Fall.png', W=1536, text=[(252, 935, 285, 978), (266, 489, 290, 531), (695, 17, 779, 75), (753, 496, 783, 540), (754, 928, 783, 972), (777, 14, 829, 75), (1258, 508, 1288, 552), (1263, 935, 1293, 978)]),
           R(('hurt', (0, 0, 1536, 545), (463, 545), 3, [266, 758, 1259]), ('hurt_b', (0, 546, 1536, 1021), (889, 1021), 3, [267, 761, 1248]))),
  'H3P10': (dict(file='ART-18_HEAD-3_PAGE-10_Prone.png', W=1536, text=[(73, 162, 267, 219)]),
           R(('prone', (0, 0, 1536, 1021), (771, 1021), 2, [393, 1125]))),
  'H4P1': (dict(file='ART-18_HEAD-4_PAGE-01_Statue.png', W=2172, text=[]),
           R(('still', (0, 0, 2172, 721), (544, 721), 4, [275, 820, 1361, 1904]))),
  'H4P2': (dict(file='ART-18_HEAD-4_PAGE-02_Wake.png', W=1536, text=[]),
           R(('reveal', (0, 0, 1536, 456), (369, 456), 3, [272, 759, 1269]), ('reveal_b', (0, 457, 1536, 1021), (880, 1021), 3, [256, 780, 1285]))),
  'H4P3': (dict(file='ART-18_HEAD-4_PAGE-03_Idle.png', W=1536, text=[(274, 867, 305, 908), (278, 426, 301, 466), (711, 930, 773, 983), (743, 426, 772, 466), (743, 867, 773, 908), (771, 930, 825, 983), (1261, 426, 1291, 466), (1261, 867, 1291, 908)]),
           R(('idle', (0, 0, 1536, 480), (385, 480), 3, [292, 762, 1280]), ('idle_b', (0, 481, 1536, 1021), (830, 1021), 3, [296, 762, 1279]))),
  'H4P4': (dict(file='ART-18_HEAD-4_PAGE-04_Walk.png', W=1536, text=[(52, 17, 107, 83), (90, 497, 111, 522), (90, 941, 110, 967), (105, 17, 163, 83), (105, 947, 124, 967), (106, 497, 134, 528), (118, 940, 135, 967), (127, 496, 147, 522), (129, 942, 145, 967), (141, 498, 158, 523), (148, 941, 168, 967), (159, 497, 178, 522), (161, 947, 182, 967), (163, 17, 210, 83), (173, 495, 260, 523), (214, 908, 236, 938), (216, 467, 232, 497), (235, 17, 291, 83), (258, 941, 279, 967), (261, 497, 282, 522), (273, 947, 292, 967), (278, 502, 295, 522), (288, 17, 350, 83), (288, 947, 308, 967), (290, 502, 310, 522), (302, 942, 319, 967), (304, 498, 356, 523), (314, 942, 357, 967), (350, 17, 573, 83), (520, 497, 549, 522), (520, 941, 555, 967), (538, 497, 563, 528), (549, 940, 576, 967), (558, 495, 587, 522), (573, 17, 620, 83), (579, 941, 600, 967), (590, 497, 636, 522), (591, 908, 613, 938), (592, 468, 613, 497), (595, 947, 628, 967), (620, 17, 667, 83), (623, 940, 669, 967), (631, 496, 672, 522), (663, 947, 683, 973), (668, 502, 686, 528), (751, 82, 786, 117), (866, 941, 887, 967), (871, 497, 914, 528), (882, 947, 900, 967), (888, 497, 898, 507), (895, 940, 921, 967), (908, 496, 937, 522), (924, 941, 948, 967), (939, 497, 962, 523), (943, 947, 963, 967), (956, 502, 976, 523), (958, 907, 981, 967), (971, 495, 989, 522), (973, 947, 991, 967), (985, 503, 1002, 523), (986, 947, 1003, 967), (997, 502, 1013, 522), (1005, 940, 1056, 967), (1014, 496, 1075, 528), (1051, 947, 1071, 973), (1113, 37, 1239, 76), (1249, 34, 1268, 80), (1251, 497, 1273, 522), (1251, 941, 1272, 967), (1265, 38, 1293, 75), (1267, 940, 1297, 967), (1268, 496, 1308, 528), (1290, 942, 1307, 967), (1302, 38, 1329, 75), (1302, 499, 1317, 522), (1310, 941, 1333, 967), (1320, 468, 1347, 522), (1324, 908, 1347, 938), (1326, 38, 1387, 76), (1327, 947, 1345, 967), (1336, 503, 1353, 522), (1340, 947, 1371, 967), (1348, 502, 1376, 523), (1373, 941, 1395, 967), (1377, 497, 1397, 522), (1382, 37, 1421, 75), (1388, 947, 1420, 967), (1391, 502, 1421, 522), (1418, 34, 1483, 81)]),
           R(('walk', (0, 0, 1536, 554), (438, 554), 4, [225, 596, 953, 1323]), ('walk_b', (0, 555, 1536, 1021), (872, 1021), 4, [211, 596, 947, 1324]))),
  'H4P6': (dict(file='ART-18_HEAD-4_PAGE-06_Bite.png', W=1536, text=[(88, 925, 232, 962), (211, 458, 256, 488), (234, 925, 269, 962), (249, 424, 268, 456), (249, 891, 276, 923), (250, 465, 287, 488), (263, 932, 296, 954), (282, 457, 306, 487), (291, 923, 457, 959), (676, 458, 699, 487), (689, 934, 729, 964), (695, 465, 729, 488), (724, 941, 738, 963), (725, 465, 748, 488), (725, 934, 752, 963), (742, 457, 783, 488), (747, 933, 771, 963), (754, 422, 780, 457), (756, 900, 803, 963), (786, 458, 809, 487), (799, 940, 820, 963), (804, 465, 824, 487), (814, 941, 847, 963), (821, 457, 860, 488), (1170, 457, 1278, 488), (1228, 933, 1273, 963), (1256, 423, 1282, 457), (1262, 900, 1305, 963), (1282, 458, 1311, 487), (1300, 933, 1323, 963), (1307, 457, 1363, 488)]),
           R(('attack', (0, 0, 1536, 510), (384, 510), 3, [253, 735, 1243]), ('attack_b', (0, 511, 1536, 1021), (853, 1021), 3, [257, 764, 1272]))),
  'H4P7': (dict(file='ART-18_HEAD-4_PAGE-07_Claws.png', W=1536, text=[(254, 892, 284, 929), (261, 470, 282, 504), (644, 19, 790, 88), (755, 470, 781, 505), (756, 892, 784, 929), (1230, 470, 1257, 504), (1250, 892, 1278, 929)]),
           R(('claw', (0, 0, 1536, 534), (436, 534), 3, [257, 719, 1211]), ('claw_b', (0, 535, 1536, 1021), (851, 1021), 3, [226, 742, 1230]))),
  'H4P8': (dict(file='ART-18_HEAD-4_PAGE-08_Flinch.png', W=1774, text=[(835, 82, 859, 105)]),
           R(('flinch', (0, 0, 1774, 884), (714, 884), 4, [212, 625, 1049, 1517]))),
  'H4P9': (dict(file='ART-18_HEAD-4_PAGE-09_Fall.png', W=1536, text=[(754, 954, 781, 991), (757, 491, 785, 529), (1059, 185, 1075, 203), (1253, 495, 1280, 533)]),
           R(('hurt', (0, 0, 1536, 523), (450, 523), 3, [258, 756, 1265]), ('hurt_b', (0, 524, 1536, 1021), (910, 1021), 3, [258, 757, 1274]))),
  'H4P10': (dict(file='ART-18_HEAD-4_PAGE-10_Prone.png', W=1536, text=[]),
           R(('prone', (0, 0, 1536, 1021), (727, 1021), 2, [426, 1192]))),
  'H5P1': (dict(file='ART-18_HEAD-5_PAGE-01_Statue.png', W=1536, text=[]),
           R(('still', (0, 0, 1536, 1021), (741, 1021), 4, [189, 573, 957, 1341]))),
  'H5P2': (dict(file='ART-18_HEAD-5_PAGE-02_Wake.png', W=1536, text=[]),
           R(('reveal', (0, 0, 1536, 492), (387, 492), 3, [272, 759, 1242]), ('reveal_b', (0, 493, 1536, 1021), (881, 1021), 3, [238, 761, 1294]))),
  'H5P3': (dict(file='ART-18_HEAD-5_PAGE-03_Idle.png', W=1536, text=[(57, 19, 192, 75), (215, 19, 262, 75), (255, 913, 285, 951), (259, 19, 309, 75), (261, 469, 285, 506), (307, 19, 572, 75), (756, 472, 781, 506), (756, 915, 782, 951), (1252, 469, 1278, 506), (1255, 915, 1282, 952), (1381, 20, 1480, 67)]),
           R(('idle', (0, 0, 1536, 528), (428, 528), 3, [273, 773, 1269]), ('idle_b', (0, 529, 1536, 1021), (872, 1021), 3, [270, 772, 1271]))),
  'H5P4': (dict(file='ART-18_HEAD-5_PAGE-04_Walk.png', W=1536, text=[(658, 929, 690, 962), (702, 916, 832, 962), (949, 409, 973, 442), (949, 865, 974, 899), (1323, 409, 1348, 442), (1324, 865, 1348, 899)]),
           R(('walk', (0, 0, 1536, 448), (353, 448), 4, [209, 569, 948, 1330]), ('walk_b', (0, 449, 1536, 1021), (813, 1021), 4, [196, 571, 951, 1340]))),
  'H5P6': (dict(file='ART-18_HEAD-5_PAGE-06_Bite.png', W=1536, text=[(292, 909, 322, 944), (749, 410, 776, 444), (784, 918, 806, 944), (824, 918, 840, 944), (1145, 410, 1178, 444), (1195, 932, 1207, 944), (1218, 910, 1249, 944), (1221, 418, 1243, 444), (1269, 918, 1294, 944), (1365, 418, 1392, 444)]),
           R(('attack', (0, 0, 1536, 471), (366, 471), 3, [278, 764, 1250]), ('attack_b', (0, 472, 1536, 1021), (865, 1021), 3, [276, 771, 1248]))),
  'H5P7': (dict(file='ART-18_HEAD-5_PAGE-07_Claws.png', W=1536, text=[(240, 927, 270, 966), (243, 466, 267, 505), (691, 12, 779, 64), (755, 465, 783, 505), (755, 927, 783, 966), (773, 27, 847, 63), (1270, 466, 1298, 505), (1273, 927, 1301, 966)]),
           R(('claw', (0, 0, 1536, 516), (431, 516), 3, [263, 768, 1284]), ('claw_b', (0, 517, 1536, 1021), (892, 1021), 3, [260, 774, 1283]))),
  'H5P8': (dict(file='ART-18_HEAD-5_PAGE-08_Flinch.png', W=1536, text=[(192, 753, 216, 795), (574, 753, 603, 795), (668, 837, 868, 882), (937, 753, 966, 795), (1320, 753, 1351, 795)]),
           R(('flinch', (0, 0, 1536, 1021), (706, 1021), 4, [210, 595, 963, 1333]))),
  'H5P9': (dict(file='ART-18_HEAD-5_PAGE-09_Fall.png', W=1536, text=[(110, 916, 144, 949), (158, 916, 184, 949), (200, 446, 218, 479), (201, 915, 224, 949), (217, 468, 229, 479), (240, 446, 267, 480), (251, 925, 272, 949), (264, 455, 290, 479), (268, 925, 310, 949), (287, 455, 325, 480), (306, 925, 342, 949), (322, 445, 346, 479), (338, 915, 427, 957), (645, 917, 677, 950), (688, 917, 724, 950), (739, 919, 773, 950), (770, 456, 792, 481), (778, 926, 802, 957), (790, 456, 810, 481), (808, 916, 826, 950), (839, 916, 865, 950), (878, 926, 903, 950), (1128, 448, 1161, 481), (1173, 448, 1203, 481), (1192, 917, 1209, 950), (1200, 456, 1225, 481), (1206, 926, 1231, 950), (1222, 456, 1243, 481), (1227, 926, 1265, 950), (1259, 456, 1278, 481), (1260, 919, 1278, 950), (1287, 447, 1312, 481), (1287, 926, 1327, 950), (1308, 456, 1333, 481), (1323, 916, 1347, 950), (1331, 456, 1351, 481), (1344, 916, 1368, 950), (1347, 447, 1373, 481), (1364, 916, 1396, 950), (1380, 455, 1401, 481)]),
           R(('hurt', (0, 0, 1536, 513), (415, 513), 3, [275, 766, 1277]), ('hurt_b', (0, 514, 1536, 1021), (865, 1021), 3, [234, 763, 1272]))),
  'H5P10': (dict(file='ART-18_HEAD-5_PAGE-10_Prone.png', W=1536, text=[]),
           R(('prone', (0, 0, 1536, 1021), (758, 1021), 2, [405, 1135]))),
  'H2P6': (dict(file='ART-18_HEAD-2_PAGE-06_Bite.png', W=1774, text=[(30, 712, 140, 765)]),     # (by hand: its wings touch, five bodies for six; cream digits)
           R(('attack', (0, 0, 1774, 720), (676, 718), 6, [212, 486, 780, 1068, 1344, 1612]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC.items()}
# four pages print a title (and a rule) across the top, its letters 75 px tall: boxed out whole (every body starts below the box)
HEADERS = {'H4P7': (0, 0, 4000, 120), 'H4P8': (0, 0, 4000, 240), 'H4P10': (0, 0, 4000, 250), 'H5P3': (0, 0, 4000, 80)}
for _L, _b in HEADERS.items():
    PAGES[_L]['text'] = PAGES[_L]['text'] + [_b]
FIX, CUTS = {}, {}
# each view's pages, its Idle's first; Fly's left out (H1 P6, the others' P5)
VIEWS = {'SE': ('H1P4', 'H1P2', 'H1P3', 'H1P5', 'H1P7', 'H1P8', 'H1P9', 'H1P10', 'H1P11')}
VIEWS.update({v: tuple('H%dP%d' % (h, p) for p in (3, 1, 2, 4, 6, 7, 8, 9, 10)) for v, h in (('NE', 2), ('S', 3), ('E', 4), ('N', 5))})
WAKE = {'SE': ('H1P3', 'H1P2'), 'NE': ('H2P2', 'H2P1'), 'S': ('H3P2', 'H3P1'), 'E': ('H4P2', 'H4P1'), 'N': ('H5P2', 'H5P1')}    # (Wake page, Statue page)
FALL = {'SE': ('H1P10', 'H1P11'), 'NE': ('H2P9', 'H2P10'), 'S': ('H3P9', 'H3P10'), 'E': ('H4P9', 'H4P10'), 'N': ('H5P9', 'H5P10')}   # (Fall page, Prone page)
def _last(L, r):                                         # (a row's last frame: on its second band where it has one)
    rows = {x[0]: x[3] for x in PAGES[L]['rows']}
    return (r + '_b', rows[r + '_b'] - 1) if r + '_b' in rows else (r, rows[r] - 1)
STAND_OF = {w: _last(w, 'reveal') for w, _ in WAKE.values()}
JOINS = {r + '_b': r for r in ('still', 'reveal', 'idle', 'walk', 'attack', 'claw', 'flinch', 'hurt', 'prone')}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'reveal', 'claw', 'still', 'prone']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'reveal': 8, 'claw': 10, 'still': 4, 'prone': 6}


def targets():
    """the Statue page by its Statue 1 at the Wake page's Wake 1 (game size); the Prone page by its Prone 1 at its own view's Fall 6"""
    cuts = AD.cut(ROOT, 'gargoyle', 'ART-18', PAGES, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit, stand_of=STAND_OF, idle_joined=True)
    def first(L, r):
        return (cuts[L].get(r) or cuts[L][r + '_b'])[0][0] if r in cuts[L] or r + '_b' in cuts[L] else None
    def last(L, r):
        rows = cuts[L].get(r + '_b') or cuts[L][r]
        return rows[-1][0]
    out = {}
    for v, (wk, st) in WAKE.items():
        out[st] = ('still', 0, AD.tall(fit(first(wk, 'reveal'), K[wk])))
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
    """the middle of the body: the median opaque column over the body's rows (the horns above and the legs below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 80 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build():
    tg = targets()
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, stand_of=STAND_OF, joins=JOINS, targets=tg, idle_joined=True)   # (every Idle frame to its median: N's first line raises its wings in two of three)
    first = AD.views(ROOT, 'gargoyle', 'ART-18', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'gargoyle', 'ART-18', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
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
    meta['source'] = 'drawn by the art desk (ART-18 FINAL, all five views, 10-21), cut by tools/gargoyle-sheet.py through tools/artdesk.py (10-22)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
