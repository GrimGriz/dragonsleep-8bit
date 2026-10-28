"""DEEP16 pipeline 2 (generated art): the art desk's lamia pages -> lamia_p1, a creature new to the grid (10-27, the monster cutter seat on
Griz's "spin up a cutter for the leftovers in fresh, everything in the outbox has been sent").

    python tools/lamia-sheet.py            # deep16/art/lamia_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/lamia/ART-20/ -- a worktree reads them there): ART-20 FINAL (10-22, the art
desk's best-of package on his "assemble best of package out of what we have and leave notes for the cutter"), all five views, one action a
page: HEAD 1 SE (its page 1 an identity sheet, not cut), HEAD 2 NE, HEAD 3 S, HEAD 4 E, HEAD 5 N; Idle 6, Walk 8, Claws 6, Dagger 6,
Touch 6, Cast 6, Disguise 6, Flinch 4, Fall 6, Prone 2.
What each became: idle, walk, attack <- Dagger (its dagger plays `attack`), claw <- Claws (the attack names its `row: 'claw'`), touch <-
Touch (Intoxicating Touch, `row: 'touch'`), cast <- Cast (Charm Person and Mirror Image), still <- Disguise 6 (the robed woman it stands as
till its first turn or a wound: Disguise Self on the gargoyle's False Appearance rows, js/ui.js) and reveal <- Disguise 6..1 (the disguise
dropped: js/ai.js plays it as its first turn begins), flinch, hurt <- Fall (played once), prone <- Prone played backwards (Prone 1 lying,
2 braced: the engine's prone row ends lying). Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (mirroring puts
the dagger in the other hand: the ruled shortcut).
The boxes by the seat's draft (each page's bodies clustered into the manifest's printed bands, each frame's x its body's middle, each strip
from 30 px over the highest foot; white glyphs boxed as text).
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 72 px from every side -- a woman's body on a lion's, about 8 ft against a hero's 6 at 52
(the heroes stand 49 to 54: tools/sheetrows.py STANDS); the art desk's turnaround stands even (about 440 px every side, one page). A later page by its first frame against its
view's Idle 1, a Prone page by its Prone 1 at its own view's Fall 6. Two passes: the second tones every page per channel to its own view's
first-pass idle, the others to the E's.
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

NAME = 'lamia_p1'
FW, FH, AX, AY = 136, 104, 68, 97              # (the NE cast's wisp 63 px each side of the anchor, N's rearing claw 92 up)
STAND = {'side': 72, 'S': 72, 'N': 72}

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC = {
  'H1P2': (dict(file='ART-20_HEAD-1_PAGE-2.png', W=1536, text=[(249, 959, 270, 989), (250, 457, 268, 487), (728, 458, 747, 487), (731, 960, 751, 989), (1211, 458, 1231, 487), (1211, 960, 1231, 989)]),
           R(('idle', (0, 0, 1536, 507), (438, 507), 3, [265, 745, 1228]), ('idle_b', (0, 508, 1536, 1021), (931, 1021), 3, [267, 754, 1236]))),
  'H1P3': (dict(file='ART-20_HEAD-1_PAGE-3.png', W=1774, text=[(222, 803, 244, 832), (223, 369, 244, 397), (643, 369, 666, 397), (651, 805, 674, 833), (1078, 805, 1102, 833), (1079, 369, 1102, 397), (1529, 369, 1551, 397), (1529, 805, 1551, 833)]),
           R(('walk', (0, 0, 1774, 435), (346, 435), 4, [236, 659, 1084, 1526]), ('walk_b', (0, 436, 1774, 884), (746, 884), 4, [226, 669, 1097, 1551]))),
  'H1P4': (dict(file='ART-20_HEAD-1_PAGE-4.png', W=1536, text=[(444, 716, 489, 773)]),
           R(('claw', (0, 0, 1536, 492), (429, 492), 3, [298, 783, 1258]), ('claw_b', (0, 493, 1536, 1021), (926, 1021), 3, [240, 735, 1270]))),
  'H1P5': (dict(file='ART-20_HEAD-1_PAGE-5.png', W=1536, text=[(89, 54, 106, 83), (90, 551, 112, 582), (587, 54, 609, 83), (654, 551, 674, 581), (1088, 54, 1110, 83), (1090, 549, 1110, 579)]),
           R(('attack', (0, 0, 1536, 533), (446, 533), 3, [270, 738, 1246]), ('attack_b', (0, 534, 1536, 1021), (919, 1021), 3, [269, 795, 1232]))),
  'H1P6': (dict(file='ART-20_HEAD-1_PAGE-6.png', W=1536, text=[(236, 920, 263, 953), (249, 436, 270, 469), (755, 436, 780, 469), (763, 920, 788, 953), (1245, 436, 1270, 469), (1265, 920, 1291, 954)]),
           R(('touch', (0, 0, 1536, 508), (400, 508), 3, [245, 752, 1244]), ('touch_b', (0, 509, 1536, 1021), (882, 1021), 3, [249, 763, 1268]))),
  'H1P7': (dict(file='ART-20_HEAD-1_PAGE-7.png', W=1536, text=[(82, 512, 104, 541), (131, 26, 149, 54), (391, 639, 411, 659), (567, 638, 586, 656), (635, 26, 655, 54), (728, 512, 748, 540), (954, 581, 973, 602), (1120, 26, 1140, 54), (1189, 512, 1209, 540), (1367, 27, 1386, 50), (1374, 85, 1395, 107), (1392, 11, 1411, 31), (1472, 67, 1486, 85)]),
           R(('cast', (0, 0, 1536, 516), (435, 516), 3, [246, 761, 1245]), ('cast_b', (0, 517, 1536, 1021), (913, 1021), 3, [264, 817, 1296]))),
  'H1P8': (dict(file='ART-20_HEAD-1_PAGE-8.png', W=1536, text=[]),
           R(('disguise', (0, 0, 1536, 485), (436, 485), 3, [263, 771, 1275]), ('disguise_b', (0, 486, 1536, 1021), (954, 1021), 3, [276, 760, 1283]))),
  'H1P9': (dict(file='ART-20_HEAD-1_PAGE-9.png', W=1536, text=[(193, 771, 216, 806), (561, 771, 590, 806), (954, 771, 982, 806), (1320, 771, 1351, 806)]),
           R(('flinch', (0, 0, 1536, 1021), (712, 1021), 4, [200, 586, 955, 1347]))),
  'H1P10': (dict(file='ART-20_HEAD-1_PAGE-10.png', W=1536, text=[(193, 462, 212, 493), (239, 853, 262, 883), (715, 463, 736, 493), (716, 855, 738, 885), (1205, 465, 1226, 495), (1259, 855, 1280, 885)]),
           R(('hurt', (0, 0, 1536, 575), (453, 575), 3, [267, 765, 1245]), ('hurt_b', (0, 576, 1536, 1021), (801, 1021), 3, [281, 753, 1265]))),
  'H1P11': (dict(file='ART-20_HEAD-1_PAGE-11.png', W=1774, text=[(72, 201, 99, 241), (1023, 201, 1055, 241)]),
           R(('prone', (0, 0, 1774, 884), (660, 884), 2, [473, 1368]))),
  'H2P1': (dict(file='ART-20_HEAD-2_PAGE-1.png', W=1536, text=[(79, 512, 100, 540), (83, 32, 99, 59), (598, 32, 618, 59), (598, 512, 618, 539), (1111, 31, 1131, 59), (1111, 512, 1131, 539)]),
           R(('idle', (0, 0, 1536, 499), (418, 499), 3, [266, 767, 1278]), ('idle_b', (0, 500, 1536, 1021), (898, 1021), 3, [264, 775, 1281]))),
  'H2P2': (dict(file='ART-20_HEAD-2_PAGE-2.png', W=1774, text=[(63, 368, 81, 393), (65, 811, 85, 836), (502, 811, 521, 836), (504, 368, 522, 393), (930, 811, 949, 836), (934, 368, 953, 393), (1364, 811, 1383, 836), (1369, 368, 1389, 393)]),
           R(('walk', (0, 0, 1774, 443), (357, 443), 4, [272, 699, 1121, 1554]), ('walk_b', (0, 444, 1774, 884), (789, 884), 4, [271, 701, 1119, 1547]))),
  'H2P3': (dict(file='ART-20_HEAD-2_PAGE-3.png', W=1536, text=[(49, 532, 77, 566), (52, 54, 72, 88), (608, 532, 635, 567), (614, 54, 642, 88), (1096, 532, 1125, 567), (1097, 52, 1125, 87)]),
           R(('claw', (0, 0, 1536, 520), (416, 520), 3, [262, 777, 1284]), ('claw_b', (0, 521, 1536, 1021), (902, 1021), 3, [251, 780, 1265]))),
  'H2P4': (dict(file='ART-20_HEAD-2_PAGE-4.png', W=1536, text=[(42, 522, 67, 553), (43, 43, 66, 75), (561, 43, 586, 75), (580, 522, 604, 553), (1084, 522, 1108, 553), (1085, 43, 1110, 75)]),
           R(('attack', (0, 0, 1536, 514), (433, 514), 3, [266, 749, 1258]), ('attack_b', (0, 515, 1536, 1021), (906, 1021), 3, [260, 760, 1250]))),
  'H2P5': (dict(file='ART-20_HEAD-2_PAGE-5.png', W=1536, text=[(272, 955, 292, 983), (275, 451, 290, 479), (758, 451, 777, 479), (758, 955, 777, 982), (1243, 451, 1263, 479), (1243, 955, 1263, 983)]),
           R(('touch', (0, 0, 1536, 504), (420, 504), 3, [280, 785, 1239]), ('touch_b', (0, 505, 1536, 1021), (916, 1021), 3, [290, 781, 1252]))),
  'H2P6': (dict(file='ART-20_HEAD-2_PAGE-6.png', W=1536, text=[(243, 931, 266, 962), (247, 453, 266, 485), (479, 494, 499, 514), (641, 510, 668, 533), (757, 454, 780, 485), (757, 932, 780, 963), (913, 533, 938, 556), (1257, 454, 1279, 485), (1257, 932, 1279, 963)]),
           R(('cast', (0, 0, 1536, 476), (413, 476), 3, [259, 747, 1244]), ('cast_b', (0, 477, 1536, 1021), (893, 1021), 3, [276, 767, 1242]))),
  'H2P7': (dict(file='ART-20_HEAD-2_PAGE-7.png', W=1536, text=[(34, 496, 56, 521), (38, 31, 55, 57), (551, 31, 573, 57), (551, 496, 573, 521), (1063, 31, 1084, 57), (1063, 496, 1084, 521)]),
           R(('disguise', (0, 0, 1536, 471), (432, 471), 3, [277, 778, 1294]), ('disguise_b', (0, 472, 1536, 1021), (926, 1021), 3, [293, 796, 1352]))),
  'H2P8': (dict(file='ART-20_HEAD-2_PAGE-8.png', W=1774, text=[(216, 725, 238, 760), (637, 725, 664, 760), (680, 153, 734, 223), (1082, 725, 1110, 760), (1184, 264, 1202, 300), (1211, 268, 1247, 311), (1539, 725, 1566, 760)]),
           R(('flinch', (0, 0, 1774, 884), (662, 884), 4, [248, 638, 1101, 1547]))),
  'H2P9': (dict(file='ART-20_HEAD-2_PAGE-9.png', W=1536, text=[]),
           R(('hurt', (0, 0, 1536, 627), (430, 627), 3, [280, 790, 1309]), ('hurt_b', (0, 628, 1536, 1021), (885, 1021), 3, [290, 785, 1275]))),
  'H2P10': (dict(file='ART-20_HEAD-2_PAGE-10.png', W=1536, text=[(453, 778, 480, 818), (1198, 778, 1227, 818)]),
           R(('prone', (0, 0, 1536, 1021), (722, 1021), 2, [481, 1193]))),
  'H3P1': (dict(file='ART-20_HEAD-3_PAGE-1.png', W=1536, text=[]),
           R(('idle', (0, 0, 1536, 502), (446, 502), 3, [263, 772, 1272]), ('idle_b', (0, 503, 1536, 1021), (925, 1021), 3, [261, 772, 1270]))),
  'H3P2': (dict(file='ART-20_HEAD-3_PAGE-2.png', W=1536, text=[]),
           R(('walk', (0, 0, 1536, 513), (435, 513), 4, [202, 579, 954, 1338]), ('walk_b', (0, 514, 1536, 1021), (908, 1021), 4, [203, 578, 957, 1340]))),
  'H3P3': (dict(file='ART-20_HEAD-3_PAGE-3.png', W=1536, text=[(77, 546, 102, 575), (79, 64, 100, 92), (306, 897, 317, 923), (338, 869, 347, 890), (587, 64, 611, 93), (590, 546, 613, 575), (1104, 546, 1127, 575), (1133, 64, 1157, 92)]),
           R(('claw', (0, 0, 1536, 525), (457, 525), 3, [256, 798, 1304]), ('claw_b', (0, 526, 1536, 1021), (929, 1021), 3, [272, 776, 1283]))),
  'H3P4': (dict(file='ART-20_HEAD-3_PAGE-4.png', W=1536, text=[]),
           R(('attack', (0, 0, 1536, 489), (434, 489), 3, [289, 776, 1267]), ('attack_b', (0, 490, 1536, 1021), (916, 1021), 3, [280, 767, 1270]))),
  'H3P5': (dict(file='ART-20_HEAD-3_PAGE-5.png', W=1536, text=[]),
           R(('touch', (0, 0, 1536, 526), (465, 526), 3, [250, 761, 1270]), ('touch_b', (0, 527, 1536, 1021), (966, 1021), 3, [256, 758, 1270]))),
  'H3P6': (dict(file='ART-20_HEAD-3_PAGE-6.png', W=1536, text=[(46, 15, 133, 48), (146, 517, 170, 547), (154, 60, 172, 90), (267, 941, 334, 971), (630, 60, 651, 90), (630, 517, 651, 547), (1092, 60, 1114, 90), (1092, 517, 1114, 547), (1289, 51, 1351, 94)]),
           R(('cast', (0, 0, 1536, 509), (442, 509), 3, [303, 775, 1251]), ('cast_b', (0, 510, 1536, 1021), (914, 1021), 3, [301, 774, 1245]))),
  'H3P7': (dict(file='ART-20_HEAD-3_PAGE-7.png', W=1536, text=[(625, 416, 647, 447)]),
           R(('disguise', (0, 0, 1536, 499), (448, 499), 3, [273, 756, 1239]), ('disguise_b', (0, 500, 1536, 1021), (954, 1021), 3, [264, 754, 1233]))),
  'H3P8': (dict(file='ART-20_HEAD-3_PAGE-8.png', W=1536, text=[]),
           R(('flinch', (0, 0, 1536, 1021), (739, 1021), 4, [205, 573, 959, 1329]))),
  'H3P9': (dict(file='ART-20_HEAD-3_PAGE-9.png', W=1536, text=[(41, 591, 68, 624), (74, 68, 93, 101), (547, 68, 572, 101), (547, 591, 572, 624), (1003, 591, 1029, 624), (1035, 68, 1060, 101)]),
           R(('hurt', (0, 0, 1536, 631), (498, 631), 3, [248, 741, 1245]), ('hurt_b', (0, 632, 1536, 1021), (888, 1021), 3, [225, 707, 1237]))),
  'H3P10': (dict(file='ART-20_HEAD-3_PAGE-10.png', W=1536, text=[]),
           R(('prone', (0, 0, 1536, 1021), (670, 1021), 2, [366, 1135]))),
  'H4P1': (dict(file='ART-20_HEAD-4_PAGE-1.png', W=1536, text=[]),
           R(('idle', (0, 0, 1536, 525), (441, 525), 3, [267, 762, 1293]), ('idle_b', (0, 526, 1536, 1021), (928, 1021), 3, [267, 767, 1296]))),
  'H4P2': (dict(file='ART-20_HEAD-4_PAGE-2.png', W=1536, text=[(184, 445, 200, 473), (184, 919, 207, 947), (575, 445, 598, 473), (576, 919, 598, 947), (950, 444, 973, 473), (950, 919, 973, 947), (1334, 445, 1357, 473), (1337, 919, 1359, 947)]),
           R(('walk', (0, 0, 1536, 542), (401, 542), 4, [225, 592, 976, 1361]), ('walk_b', (0, 543, 1536, 1021), (872, 1021), 4, [228, 592, 987, 1363]))),
  'H4P3': (dict(file='ART-20_HEAD-4_PAGE-3.png', W=1536, text=[(91, 553, 121, 586), (104, 58, 129, 91), (498, 719, 546, 803), (599, 58, 628, 91), (629, 552, 658, 586), (1124, 58, 1153, 91), (1124, 552, 1153, 586)]),
           R(('claw', (0, 0, 1536, 535), (447, 535), 3, [270, 821, 1315]), ('claw_b', (0, 536, 1536, 1021), (914, 1021), 3, [263, 808, 1292]))),
  'H4P4': (dict(file='ART-20_HEAD-4_PAGE-4.png', W=1536, text=[(38, 528, 68, 563), (41, 42, 64, 79), (566, 42, 594, 79), (644, 529, 671, 563), (1086, 42, 1114, 79), (1111, 529, 1140, 563)]),
           R(('attack', (0, 0, 1536, 531), (436, 531), 3, [270, 764, 1294]), ('attack_b', (0, 532, 1536, 1021), (893, 1021), 3, [284, 832, 1301]))),
  'H4P5': (dict(file='ART-20_HEAD-4_PAGE-5.png', W=1536, text=[(41, 534, 71, 571), (43, 41, 67, 78), (554, 41, 584, 78), (589, 534, 619, 571), (1065, 41, 1096, 78), (1114, 533, 1142, 571)]),
           R(('touch', (0, 0, 1536, 534), (425, 534), 3, [264, 753, 1266]), ('touch_b', (0, 535, 1536, 1021), (907, 1021), 3, [270, 777, 1298]))),
  'H4P6': (dict(file='ART-20_HEAD-4_PAGE-6.png', W=1536, text=[(1367, 96, 1385, 119)]),
           R(('cast', (0, 0, 1536, 530), (431, 530), 3, [248, 740, 1226]), ('cast_b', (0, 531, 1536, 1021), (915, 1021), 3, [233, 776, 1295]))),
  'H4P7': (dict(file='ART-20_HEAD-4_PAGE-7.png', W=1536, text=[(61, 37, 82, 71), (61, 527, 85, 561), (568, 37, 591, 71), (635, 527, 658, 561), (1063, 37, 1086, 71), (1147, 528, 1171, 561)]),
           R(('disguise', (0, 0, 1536, 495), (425, 495), 3, [312, 794, 1290]), ('disguise_b', (0, 496, 1536, 1021), (953, 1021), 3, [321, 838, 1375]))),
  'H4P8': (dict(file='ART-20_HEAD-4_PAGE-8.png', W=1536, text=[]),
           R(('flinch', (0, 0, 1536, 529), (468, 529), 2, [416, 1116]), ('flinch_b', (0, 530, 1536, 1021), (928, 1021), 2, [413, 1183]))),
  'H4P9': (dict(file='ART-20_HEAD-4_PAGE-9.png', W=1536, text=[(70, 589, 94, 617), (85, 93, 104, 121), (571, 589, 593, 617), (613, 94, 635, 121), (1048, 593, 1070, 621), (1086, 93, 1108, 121)]),
           R(('hurt', (0, 0, 1536, 622), (464, 622), 3, [281, 782, 1289]), ('hurt_b', (0, 623, 1536, 1021), (827, 1021), 3, [305, 791, 1285]))),
  'H4P10': (dict(file='ART-20_HEAD-4_PAGE-10.png', W=1536, text=[(88, 293, 110, 332), (903, 293, 931, 332)]),
           R(('prone', (0, 0, 1536, 1021), (727, 1021), 2, [429, 1209]))),
  'H5P1': (dict(file='ART-20_HEAD-5_PAGE-1.png', W=1536, text=[]),
           R(('idle', (0, 0, 1536, 488), (426, 488), 3, [291, 767, 1243]), ('idle_b', (0, 489, 1536, 1021), (902, 1021), 3, [285, 769, 1250]))),
  'H5P2': (dict(file='ART-20_HEAD-5_PAGE-2.png', W=1536, text=[(53, 26, 73, 58), (53, 495, 76, 526), (434, 26, 457, 58), (434, 495, 457, 526), (828, 26, 851, 58), (828, 495, 851, 526), (1208, 26, 1231, 58), (1208, 495, 1230, 526)]),
           R(('walk', (0, 0, 1536, 484), (412, 484), 4, [202, 582, 970, 1349]), ('walk_b', (0, 485, 1536, 1021), (890, 1021), 4, [210, 584, 969, 1340]))),
  'H5P3': (dict(file='ART-20_HEAD-5_PAGE-3.png', W=1536, text=[(424, 621, 435, 635), (440, 526, 469, 570), (444, 619, 457, 645), (470, 550, 480, 563)]),
           R(('claw', (0, 0, 1536, 522), (412, 522), 3, [257, 761, 1255]), ('claw_b', (0, 523, 1536, 1021), (912, 1021), 3, [248, 755, 1238]))),
  'H5P4': (dict(file='ART-20_HEAD-5_PAGE-4.png', W=1536, text=[(138, 510, 162, 540), (149, 28, 168, 57), (590, 28, 614, 57), (591, 510, 615, 540), (1079, 510, 1103, 539), (1084, 28, 1109, 57)]),
           R(('attack', (0, 0, 1536, 493), (421, 493), 3, [282, 749, 1251]), ('attack_b', (0, 494, 1536, 1021), (904, 1021), 3, [289, 752, 1244]))),
  'H5P5': (dict(file='ART-20_HEAD-5_PAGE-5.png', W=1536, text=[(155, 507, 177, 535), (157, 25, 177, 53), (639, 24, 659, 52), (639, 507, 659, 535), (1145, 24, 1165, 52), (1145, 509, 1166, 538)]),
           R(('touch', (0, 0, 1536, 477), (426, 477), 3, [278, 753, 1242]), ('touch_b', (0, 478, 1536, 1021), (927, 1021), 3, [291, 758, 1256]))),
  'H5P6': (dict(file='ART-20_HEAD-5_PAGE-6.png', W=1536, text=[(392, 480, 464, 506), (1105, 62, 1124, 84)]),
           R(('cast', (0, 0, 1536, 532), (415, 532), 3, [305, 776, 1260]), ('cast_b', (0, 533, 1536, 1021), (927, 1021), 3, [280, 775, 1259]))),
  'H5P7': (dict(file='ART-20_HEAD-5_PAGE-7.png', W=1536, text=[(125, 27, 144, 53), (125, 497, 145, 524), (611, 497, 631, 524), (613, 27, 633, 53), (1099, 27, 1118, 53), (1099, 497, 1119, 524)]),
           R(('disguise', (0, 0, 1536, 487), (421, 487), 3, [273, 764, 1247]), ('disguise_b', (0, 488, 1536, 1021), (949, 1021), 3, [270, 762, 1249]))),
  'H5P8': (dict(file='ART-20_HEAD-5_PAGE-8.png', W=1536, text=[(180, 171, 199, 200), (554, 172, 579, 200), (570, 231, 622, 285), (950, 169, 974, 199), (1328, 169, 1353, 199)]),
           R(('flinch', (0, 0, 1536, 1021), (717, 1021), 4, [182, 561, 967, 1346]))),
  'H5P9': (dict(file='ART-20_HEAD-5_PAGE-9.png', W=1536, text=[(60, 59, 80, 86), (60, 578, 81, 605), (583, 59, 603, 86), (583, 578, 603, 605), (1098, 59, 1119, 86), (1099, 578, 1119, 605)]),
           R(('hurt', (0, 0, 1536, 597), (454, 597), 3, [239, 764, 1294]), ('hurt_b', (0, 598, 1536, 1021), (862, 1021), 3, [248, 760, 1275]))),
  'H5P10': (dict(file='ART-20_HEAD-5_PAGE-10.png', W=1536, text=[(395, 826, 427, 872)]),
           R(('prone', (0, 0, 1536, 1021), (758, 1021), 2, [434, 1071]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC.items()}
FIX, CUTS = {}, {}
# each view's pages, its Idle's first: Idle, Walk, Claws, Dagger, Touch, Cast, Disguise, Flinch, Fall, Prone
VIEWS = {'SE': tuple('H1P%d' % p for p in range(2, 12))}
VIEWS.update({v: tuple('H%dP%d' % (h, p) for p in range(1, 11)) for v, h in (('NE', 2), ('S', 3), ('E', 4), ('N', 5))})
FALL = {v: (ls[8], ls[9]) for v, ls in VIEWS.items()}      # (Fall page, Prone page)
JOINS = {r + '_b': r for r in ('idle', 'walk', 'attack', 'claw', 'touch', 'cast', 'disguise', 'flinch', 'hurt', 'prone')}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'cast', 'reveal', 'flinch', 'claw', 'still', 'prone', 'touch']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'cast': 8, 'reveal': 8, 'flinch': 10, 'claw': 10, 'still': 4, 'prone': 6, 'touch': 8}


def targets():
    """the Prone page by its Prone 1 at its own view's Fall 6 (game size)"""
    cuts = AD.cut(ROOT, 'lamia', 'ART-20', PAGES, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit, idle_joined=True)
    out = {}
    for v, (fa, pr) in FALL.items():
        last = (cuts[fa].get('hurt_b') or cuts[fa]['hurt'])[-1][0]
        out[pr] = ('prone', 0, AD.tall(fit(last, K[fa])))
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
    """the middle of the body: the median opaque column over the body's rows (the hair and arms above and the paws below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 80 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


_tones0 = AD.tones
def _tones(*a, **k):
    """a Cast page toned as its view's Touch page (the cast's violet light pulled the per-channel tone: N's blue to 0.79), a Prone page as
    its Fall page (its first frame lies down, more lion than the idle it would be measured against)"""
    T = _tones0(*a, **k)
    for v, ls in VIEWS.items():
        T[ls[5]], T[ls[9]] = T[ls[4]], T[ls[8]]
    return T
AD.tones = _tones


def build():
    tg = targets()
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, joins=JOINS, targets=tg, idle_joined=True)
    first = AD.views(ROOT, 'lamia', 'ART-20', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'lamia', 'ART-20', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
    d = {v: dict(rows, prone=rows['prone'][::-1], still=rows['disguise'][-1:], reveal=rows['disguise'][::-1]) for v, rows in d.items()}
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
    meta['source'] = 'drawn by the art desk (ART-20 FINAL, all five views, 10-22), cut by tools/lamia-sheet.py through tools/artdesk.py (10-27)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
    # the cast row's light taken out and drawn by the code at her hand (10-28, Griz: "magic spark on spell cast appears behind her, have code draw it when she casts"): tools/castspark.py
    spec = importlib.util.spec_from_file_location('castspark', os.path.join(ROOT, 'tools', 'castspark.py')); cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
    cs.unspark(NAME)
