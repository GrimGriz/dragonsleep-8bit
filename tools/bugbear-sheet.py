"""DEEP16 pipeline 2 (generated art): Griz's two GPT bugbear sheets -> bugbear_p1 (the bugbear) and bugbearchief_p2 (the chief).

    python tools/bugbear-sheet.py            (writes deep16/art/bugbear_p1 and bugbearchief_p2, .png/.json)
    python tools/bugbear-sheet.py check      (also the cut overlays, dev/visions/bugbear/cut-<look>.png)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Ogre Warrior GPT.png and Ogre_GPT.png -- Griz, 2026-10-07,
from deep16-art-bugbear.md handed to GPT whole ("try me the bugbear as an .md with all the sheets listed and we'll see what comes out"; "the
bugbear came back from gpt as ogre"); his ruling on the two, "Bugbear and chief": the shaggy one ("Ogre Warrior") is the bugbear, the tusked
one with the topknot ("Ogre_GPT") the chief. GPT drew the four sheets as four panels of one 1536 x 1024 image, so every frame is about game
size: nothing to downscale, and they come out softer than the goblin's (tools/goblin-sheet.py; its sheets were 2-4x game size).

Each panel's rows are cut by tools/sheetrows.py on boxes read off the image; the panels' number labels are small (about 9 px) and some are
hidden behind a figure, so a row may give its frames' x by hand (XS below, read off the image and the probe). The rows face RIGHT: NE, E and
SE take them as drawn, SW, W and NW mirrored; S takes sheet 3's rows, N sheet 4's (fall, prone, lurk side-on only, climb side and back).
The scale is by the figure's area against each image's turnaround, as the goblin's (K below). The seat's calls: where a row was drawn with
nine frames (a number twice), the second is dropped; the chief's javelin rows are not cut (it has no javelin in deep16/data/foes.js). Lurk is
the `still` row: js/ui.js plays it for a foe that has not acted or been woken.

THE SIDE ROWS RE-ROLLED (10-07, his: "bugbear GPT and bugbear chief GPT are in the _src now"): deep16/_src/Bugbear GPT.png and bugbear chief
GPT.png, one sheet an image at about 2.5x game size (the pastes in deep16-art-in-hand.md, "The bugbear"), give the side rows -- idle, walk,
morningstar, javelin, flinch, the fall from standing, a prone; the packed images keep the front, the back and the tricks, toned to the re-rolls'
orange (TONE). The bugbear's re-roll drew three flinch frames (played 1 2 3 1); the chief's skipped the second swing it was asked for.

THE CHIEF'S SECOND SWING (10-08, his re-roll of that one row: deep16/_src/bugbear chief GPT backhand 2.png): `morningstar2`, the side frames
from that sheet, the front and the back the first swing's; js/battle.js plays it for the chief's second blow of a turn (multi: two morningstars).
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
if not os.path.exists(os.path.join(SRC, 'Ogre_GPT.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per image: text boxes (a blob wholly inside one is dropped) and its rows, each (row, band x0 y0 x1 y1, label strip y0 y1, labels[, xs by
# hand]); a row's name is '<panel>.<row>': s1 the side rows, s2 the tricks, s3 from the front, s4 from behind
IMAGES = {
    'bugbear': dict(file='Ogre Warrior GPT.png',
        text=[(5, 5, 400, 30), (10, 28, 214, 168),                                     # sheet 1's title, the portrait
              (128, 481, 147, 498), (228, 481, 241, 498),                               # the fall's "1" and "2", in the prone row's band
              (143, 693, 152, 707), (217, 693, 229, 707), (292, 693, 305, 707), (375, 693, 387, 707), (458, 693, 470, 707),
              (535, 693, 548, 707), (618, 693, 630, 708), (700, 693, 712, 707),         # sheet 3's walk numbers, in the morningstar's band
              (785, 690, 896, 725),                                                     # sheet 4's "Morningstar", beside its first frame
              (888, 878, 1256, 935), (1020, 933, 1240, 947), (925, 1003, 1436, 1018),   # sheet 4's flinch (unused) and its numbers, the climb's numbers
              (785, 180, 868, 205)],                                                    # sheet 2's "Ambush" (its last letter lay in the band)
        rows=[('s1.turn', (228, 49, 763, 158), (35, 49), TURN, [300, 423, 551, 676]),
              ('s1.idle', (100, 160, 763, 212), (213, 222), NUM(6)),
              ('s1.walk', (100, 223, 763, 273), (274, 284), NUM(8)),
              ('s1.morningstar', (125, 284, 763, 338), (339, 348), NUM(6), [166, 251, 343, 436, 520, 606]),
              ('s1.javelin', (100, 349, 763, 392), (393, 403), NUM(6), [165, 250, 334, 436, 521, 622]),
              ('s1.flinch', (100, 403, 763, 441), (442, 451), NUM(4)),
              ('s1.fall', (100, 451, 763, 482), (482, 496), NUM(6), [148, 240, 335, 440, 550, 680]),
              ('s1.prone', (100, 483, 330, 512), (483, 512), NUM(2), [178, 270]),
              ('s2.lurk', (860, 50, 1532, 120), (121, 132), NUM(4)),
              ('s2.ambush', (860, 132, 1532, 238), (239, 250), NUM(6)),
              ('s2.climb', (860, 250, 1532, 389), (390, 401), NUM(6)),
              ('s3.idle', (95, 550, 763, 619), (620, 630), NUM(6)),
              ('s3.walk', (95, 630, 763, 694), (695, 706), NUM(8), [147, 223, 298, 381, 462, 542, 623, 706]),
              ('s3.morningstar', (130, 694, 763, 768), (769, 780), NUM(6)),     # (from the walk's numbers down: two balls rise to 692)
              ('s3.javelin', (100, 780, 763, 842), (843, 853), NUM(6)),
              ('s3.ambush', (100, 853, 763, 928), (929, 940), NUM(6)),
              ('s3.flinch', (100, 940, 763, 1005), (1006, 1016), NUM(4)),
              ('s4.idle', (870, 550, 1532, 605), (606, 616), NUM(6)),
              ('s4.walk', (870, 616, 1532, 673), (674, 684), ['1', '2', '3', '4', '5', '6', '6b', '7', '8'],
               [924, 997, 1073, 1144, 1215, 1288, 1354, 1420, 1494]),
              ('s4.morningstar', (900, 684, 1532, 741), (742, 752), NUM(6)),
              ('s4.javelin', (870, 752, 1532, 806), (807, 816), NUM(6), [938, 1017, 1117, 1210, 1306, 1403]),   # (numbered 1 1 3 4 5 6)
              ('s4.ambush', (870, 816, 1532, 878), (879, 888), NUM(6)),
              ('s4.climb', (870, 920, 1532, 1018), (1006, 1016), NUM(6))]),     # (its flinch is drawn facing the viewer: not cut, N plays the side flinch)
    'chief': dict(file='Ogre_GPT.png',
        text=[(0, 0, 420, 40), (14, 32, 192, 168)],                                     # sheet 1's title, the portrait
        rows=[('s1.turn', (360, 20, 767, 132), (133, 146), TURN, [419, 508, 602, 697]),
              ('s1.idle', (115, 150, 767, 211), (212, 222), NUM(6)),
              ('s1.walk', (115, 222, 767, 273), (274, 284), ['1', '2', '3', '4', '5', '6', '6b', '7', '8'],
               [151, 227, 296, 372, 447, 518, 586, 653, 723]),
              ('s1.morningstar', (140, 284, 767, 338), (339, 348), NUM(6)),
              ('s1.flinch', (100, 414, 305, 467), (468, 479), NUM(4), [133, 186, 236, 280]),        # (drawn facing the viewer)
              ('s1.fall', (350, 414, 767, 467), (468, 479), ['1', '2', '3', '5', '6', '2b'], [397, 462, 532, 598, 661, 726]),
              ('s2.lurk', (880, 40, 1536, 123), (124, 135), NUM(4), [944, 1040, 1136, 1234]),
              ('s2.ambush', (890, 140, 1536, 250), (251, 262), NUM(6)),
              ('s2.climb', (870, 262, 1536, 429), (430, 441), NUM(6)),
              ('s3.idle', (115, 515, 767, 590), (591, 601), NUM(6)),
              ('s3.walk', (115, 601, 767, 675), (676, 686), ['1', '2', '3', '4', '5', '6', '6b', '7', '8'],
               [157, 235, 308, 379, 450, 519, 586, 653, 722]),
              ('s3.morningstar', (145, 686, 767, 750), (751, 761), NUM(6)),
              ('s3.ambush', (115, 832, 767, 908), (909, 920), NUM(6), [169, 260, 352, 438, 527, 618]),
              ('s3.flinch', (115, 920, 767, 990), (991, 1001), NUM(4)),
              ('s4.idle', (880, 520, 1536, 587), (588, 602), NUM(6), [944, 1035, 1122, 1209, 1292, 1379]),
              ('s4.walk', (880, 612, 1536, 664), (665, 676), ['1', '2', '3', '4', '4b', '5', '6', '7', '8'],
               [942, 1020, 1091, 1162, 1230, 1298, 1366, 1434, 1498]),
              ('s4.morningstar', (900, 676, 1536, 740), (741, 751), NUM(6), [943, 1028, 1110, 1198, 1286, 1377]),
              ('s4.ambush', (880, 813, 1536, 873), (874, 885), NUM(6), [943, 1030, 1116, 1205, 1291, 1378]),
              ('s4.climb', (880, 912, 1440, 1013), (1007, 1018), NUM(6), [942, 1027, 1122, 1217, 1307, 1390])]),   # (a seventh climber, unnumbered, past 1440)
}
# his re-rolls of the side rows, one sheet an image and large (10-07, "bugbear GPT and bugbear chief GPT are in the _src now"): they take the side
# rows the packed sheet 1 gave (idle, walk, morningstar, javelin, flinch, fall, prone); the tricks (lurk, ambush, climb) stay the packed sheet 2's
IMAGES['bugbear2'] = dict(file='Bugbear GPT.png',
    text=[(10, 60, 130, 100), (10, 210, 125, 255), (10, 365, 205, 412), (10, 522, 130, 570), (10, 660, 125, 700), (10, 802, 100, 846),
          (10, 928, 115, 968)],
    rows=[('s1.idle', (150, 5, 1536, 143), (144, 161), NUM(6), [239, 476, 694, 924, 1160, 1401]),
          ('s1.walk', (125, 161, 1536, 290), (291, 308), NUM(8), [208, 378, 557, 730, 907, 1075, 1250, 1429]),
          ('s1.morningstar', (205, 292, 1536, 451), (452, 469), NUM(6), [298, 474, 695, 888, 1107, 1335]),
          ('s1.javelin', (130, 470, 1536, 607), (608, 626), NUM(6), [259, 498, 698, 892, 1131, 1369]),
          ('s1.flinch', (130, 627, 1536, 746), (747, 766), NUM(3), [246, 489, 726]),
          ('s1.fall', (130, 767, 1536, 885), (886, 903), NUM(6), [227, 435, 633, 861, 1120, 1384]),
          ('s1.prone', (130, 905, 1536, 998), (999, 1016), NUM(2), [261, 566])])
IMAGES['bugbear2']['text'] += [(200, 289, 217, 309), (370, 289, 388, 309), (549, 289, 566, 309), (722, 289, 739, 309), (899, 289, 916, 309),
                               (1067, 289, 1084, 309), (1242, 289, 1259, 309), (1421, 289, 1438, 309)]   # the walk's numbers, in the morningstar's band
IMAGES['chief2'] = dict(file='bugbear chief GPT.png',
    text=[(10, 58, 120, 100), (10, 215, 120, 256), (10, 388, 190, 430), (10, 552, 130, 592), (10, 694, 120, 734), (10, 846, 90, 884),
          (10, 984, 110, 1030)],
    rows=[('s1.idle', (130, 5, 1448, 144), (145, 162), NUM(6), [222, 397, 574, 759, 935, 1111]),
          ('s1.walk', (120, 162, 1448, 305), (306, 323), NUM(8), [207, 345, 505, 659, 829, 998, 1167, 1349]),
          ('s1.morningstar', (190, 323, 1448, 480), (481, 498), NUM(6), [269, 456, 643, 814, 1003, 1207]),
          ('s1.flinch', (130, 662, 1448, 781), (782, 799), NUM(4), [212, 369, 531, 697]),
          ('s1.fall', (130, 800, 1448, 929), (930, 947), NUM(6), [206, 386, 562, 765, 1056, 1311]),
          ('s1.prone', (130, 947, 1448, 1055), (1056, 1073), NUM(2), [235, 470])])   # (its javelin row is not cut: the chief has none)
# the chief's second swing, his re-roll of that one row (10-08, "bugbear chief GPT backhand 2.png", for the art list's "Morningstar 2"): six
# frames side-on, no labels but the numbers -- its second blow of the turn plays it (js/battle.js, a row named for the attack and numbered)
IMAGES['chief3'] = dict(file='bugbear chief GPT backhand 2.png', text=[],
    rows=[('s1.morningstar2', (20, 200, 2172, 540), (550, 600), NUM(6))])
IMAGES['chief']['text'] += [(885, 876, 1176, 925), (915, 924, 1155, 937), (935, 1006, 1400, 1019), (785, 695, 910, 718)]   # (the last: sheet 4's
                                                            # "Morningstar (6)", its bracket in the band)   # sheet 4's flinch (drawn facing the viewer:
                                                            # unused, N plays the side flinch) and its numbers, the climb's numbers
# the panels' border lines (rows, columns), painted navy before the cut: a figure touching one (the bugbear's prone, on its panel's floor)
# would join it into one long blob, and sheetrows drops a long thin blob as a rule
ERASE = {'bugbear': [(932, 934, 941, 944)]}                 # the back flinch's "1", fused to climb 1's raised hand
BORDERS = {'bugbear2': ([], []), 'chief2': ([], []), 'chief3': ([], []),
           'bugbear': ([2, 3, 513, 514, 519, 520, 521, 1020, 1021], [2, 3, 4, 763, 764, 771, 772, 773, 1532, 1533]),
           'chief': ([485, 486, 1023], [0, 767, 768, 1534, 1535])}
# the rest of the rows' frames by hand too, from the probe of the number labels (detection read a raised hand or a spear tip as a label)
XS = {('bugbear', 's1.idle'): [137, 217, 298, 378, 460, 542], ('bugbear', 's1.walk'): [139, 217, 292, 363, 437, 512, 587, 662],
      ('bugbear', 's1.flinch'): [136, 217, 298, 374], ('bugbear', 's2.lurk'): [923, 1035, 1145, 1251],
      ('bugbear', 's2.ambush'): [924, 1029, 1140, 1247, 1361, 1467], ('bugbear', 's2.climb'): [925, 1028, 1129, 1229, 1335, 1436],
      ('bugbear', 's3.idle'): [144, 237, 332, 426, 521, 615], ('bugbear', 's3.morningstar'): [169, 262, 357, 444, 542, 623],
      ('bugbear', 's3.javelin'): [157, 253, 347, 444, 538, 626], ('bugbear', 's3.ambush'): [156, 255, 359, 461, 553, 648],
      ('bugbear', 's3.flinch'): [141, 236, 329, 427], ('bugbear', 's4.idle'): [921, 1015, 1109, 1203, 1298, 1388],
      ('bugbear', 's4.morningstar'): [938, 1034, 1117, 1212, 1301, 1395], ('bugbear', 's4.ambush'): [926, 1030, 1133, 1230, 1332, 1421],
      ('bugbear', 's4.climb'): [932, 1040, 1136, 1227, 1331, 1427],
      ('chief', 's1.idle'): [151, 235, 321, 408, 494, 580], ('chief', 's1.morningstar'): [160, 234, 320, 404, 489, 573],
      ('chief', 's2.ambush'): [952, 1050, 1140, 1234, 1329, 1425], ('chief', 's2.climb'): [941, 1037, 1135, 1238, 1337, 1438],
      ('chief', 's3.idle'): [171, 257, 341, 422, 507, 591], ('chief', 's3.morningstar'): [178, 259, 340, 422, 507, 593],
      ('chief', 's3.flinch'): [167, 257, 335, 414]}
# loose bits by hand: look -> row -> [(box on the image: every blob wholly inside it, the label it belongs to)]
FIX = {'bugbear2': {'s1.fall': [((950, 825, 1000, 875), '5'), ((1210, 825, 1260, 875), '6')]},   # the dropped morningstars, each its own frame's
       'bugbear': {'s1.prone': [((100, 483, 226, 513), '1'), ((226, 483, 330, 513), '2')]},    # (lying flat, too thin to seed a frame)
       'chief': {'s1.flinch': [((258, 414, 305, 467), '4')]}}                                   # (its small last frame seeds none)
CUT, TOUCH_OK = {}, {}


def cut(look, check=False):
    """-> {row: [(name, image, box)]} for one image, by sheetrows; a row with xs by hand gets them in place of its labels' detection"""
    s = IMAGES[look]
    hand = {(r[1][0], r[2][0]): r[4] if len(r) > 4 else XS[(look, r[0])] for r in s['rows'] if len(r) > 4 or (look, r[0]) in XS}
    orig = SR.label_xs
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    img = np.asarray(Image.open(os.path.join(SRC, s['file'])).convert('RGB')).copy()
    navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
    rows_, cols_ = BORDERS[look]
    img[rows_, :] = navy
    img[:, cols_] = navy
    for x0, y0, x1, y1 in ERASE.get(look, ()):
        img[y0:y1, x0:x1] = navy
    tmp = os.path.join(tempfile.gettempdir(), 'bugbear-sheet-%s.png' % look)
    Image.fromarray(img).save(tmp)
    try:
        spec = dict(s, rows=[r[:4] for r in s['rows']])
        over = [] if check else None
        out = SR.cut_sheet(tmp, spec, fix=FIX.get(look), cuts=CUT.get(look), touch_ok=TOUCH_OK.get(look, ()),
                           overlay=over, tag=look)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'bugbear'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%s.png' % look))
    return out


# the scale, image px a game px, per panel: set by the front idle (the bugbear about 56 px, the chief 60 -- a touch bigger, the boss), the other
# panels by the figure's area against the image's turnaround as the goblin's (sqrt(area), rows to the turnaround's view: the bugbear's side idle
# 0.549 of its Right, front 0.650 of its Front, back 0.615 of its Back, the tricks' crouch 1.34 of the side idle; the chief's 0.652, 0.737,
# 0.744, 1.37). Under 1 is a little upscale (the bugbear's side rows, 7%): LANCZOS there, BOX for every downscale
K = {'bugbear': {'s3': 62 / 56.0}, 'chief': {'s3': 68 / 60.0}}
for _look, (_r1, _r3, _r4, _r2) in {'bugbear': (0.549, 0.650, 0.615, 1.34), 'chief': (0.652, 0.737, 0.744, 1.37)}.items():
    _k3 = K[_look]['s3']
    K[_look].update({'s1': _k3 * _r1 / _r3, 's4': _k3 * _r4 / _r3})
    K[_look]['s2'] = K[_look]['s1'] * _r2
# the engine's rows: side (sheets 1 and 2, facing right), S (sheet 3), N (sheet 4); each (panel.row, the labels in the order played)
LOOKS = {
    'bugbear_p1': dict(look='bugbear', rows={
        'idle': dict(side='bugbear2:s1.idle', S='s3.idle', N='s4.idle'),
        'walk': dict(side='bugbear2:s1.walk', S='s3.walk', N=('s4.walk', ['1', '2', '3', '4', '5', '6', '7', '8'])),
        'morningstar': dict(side='bugbear2:s1.morningstar', S='s3.morningstar', N='s4.morningstar'),
        'attack': dict(side='bugbear2:s1.morningstar', S='s3.morningstar', N='s4.morningstar'),
        'javelin': dict(side='bugbear2:s1.javelin', S='s3.javelin', N='s4.javelin'),
        'ambush': dict(side='s2.ambush', S='s3.ambush', N='s4.ambush'),
        'still': dict(side='s2.lurk'),
        'climb': dict(side='s2.climb', N='s4.climb'),
        'flinch': dict(side=('bugbear2:s1.flinch', ['1', '2', '3', '1']), S='s3.flinch'),   # (the re-roll drew three: back to its first to make four)
        'hurt': dict(side='bugbear2:s1.fall'),
        'prone': dict(side=('bugbear2:s1.prone', ['2', '1']))}),          # (up on an arm, then lying: it lies at its last frame)
    'bugbearchief_p2': dict(look='chief', rows={
        'idle': dict(side='chief2:s1.idle', S='s3.idle', N='s4.idle'),
        'walk': dict(side='chief2:s1.walk', S=('s3.walk', ['1', '2', '3', '4', '5', '6', '7', '8']),
                     N=('s4.walk', ['1', '2', '3', '4', '5', '6', '7', '8'])),
        'morningstar': dict(side='chief2:s1.morningstar', S='s3.morningstar', N='s4.morningstar'),
        'morningstar2': dict(side='chief3:s1.morningstar2', S='s3.morningstar', N='s4.morningstar'),   # (from the front and behind, the first swing's)
        'attack': dict(side='chief2:s1.morningstar', S='s3.morningstar', N='s4.morningstar'),
        'ambush': dict(side='s2.ambush', S='s3.ambush', N='s4.ambush'),
        'still': dict(side='s2.lurk'),
        'climb': dict(side='s2.climb', N='s4.climb'),
        'flinch': dict(side='chief2:s1.flinch', S='s3.flinch'),
        'hurt': dict(side='chief2:s1.fall'),
        'prone': dict(side=('chief2:s1.prone', ['2', '1']))}),            # (up on its hands, then lying)
}
# the re-rolls' scale: their side idle's area against the packed side idle's at its K (sqrt(area) 105.5 to 41.8 the bugbear's, 99.8 to 38.8 the
# chief's): the same body at the same size -- their idles stand straighter, about 54 and 52 px against the packed hunch's 49 and 50
K['bugbear2'] = {'s1': K['bugbear']['s1'] * 105.5 / 41.8}
K['chief2'] = {'s1': K['chief']['s1'] * 99.8 / 38.8}
# the second swing's: its guard frames (1 and 6) against the first swing's (1 and 6) by area, 6.03 to 6.08 -- frame 1 about 50 px to their 48
K['chief3'] = {'s1': 6.05}
# the packed images' colour to the re-rolls' (they hold six facings of eight): the re-rolls drew the fur a more saturated orange (at game size,
# the fur's mean 123/72/36 the bugbear's re-roll to 117/75/45 its packed front; the chief's 129/77/39 to 129/85/48): each channel times a factor,
# the greys (the steel, the javelins' heads) left be
TONE = {'bugbear': (1.046, 0.960, 0.805), 'chief': (1.000, 0.909, 0.810),
        'chief3': (1.105, 1.141, 1.201)}           # (the second swing's sheet drew it darker: its fur 115/68/34 to the first swing's 127/78/41)
RELEASE = {'javelin': 3}                                     # the frame the javelin leaves on (frame 4, the arm thrown forward): js/battle.js
FH, AY = 144, 132

# ART-27 (the bugbear) and ART-28 (the chief), 10-15: the art desk drew the views the sheets lacked (RULED 10-14, five drawn views: S, SE,
# E, NE, N; SE mirrors to SW, NE to NW), six pages each in deep16/_src/bugbear/ART-27/ and _src/bugbearchief/ART-28/ (ART-28's
# ART-28-FINAL-MANIFEST.md; ART-27's manifest is the "## ART-27" section of its cutter log; the desk's papers in
# _src/art-desk/received-2026-10-14-ART-27/ and -ART-28/):
#     H1P1  SE: Idle 6, Walk 8, Morningstar 6, Javelin 6 (the bugbear) / Morningstar 2 6 (the chief)
#     H1P2  SE: Flinch 4, Fall 6, Prone 2, Lurk 4, Ambush 6
#     H2P1, H2P2  NE: the same rows
#     H3P1  S: Fall 6, Prone 2, Lurk 4
#     H5P1  N: Flinch 4, Fall 6, Prone 2, Lurk 4
# HEAD 1 plays SE and HEAD 2 NE for every row; HEADs 3 and 5 replace only the rows they drew. E and W keep the side re-rolls, S and N their
# packed rows for the rest, and climb stays as it was in every facing (none drawn). Per page: its row names' boxes and its rows -- (the page's
# row, its number strip y0 y1, the numbers' x's), read off the page (dev: the white digits under each frame). A page's rows crowd (a raised
# morningstar reaches up to the numbers above), so each blob goes to the row its centre lies in (as tools/mirrorgnoll-sheet.py cut31).
ART = {'bugbear': os.path.join(SRC, 'bugbear', 'ART-27'), 'chief': os.path.join(SRC, 'bugbearchief', 'ART-28')}
PAGES = {
    'bugbear': {
        'H1P1': dict(file='ART-27_HEAD-1_PAGE-1.png', names=[(20, 106, 86, 130), (20, 305, 99, 329), (20, 522, 232, 552), (20, 726, 142, 750)],
                     rows=[('idle', (196, 217), [290, 540, 782, 1032, 1290, 1565]),
                           ('walk', (401, 422), [247, 449, 636, 837, 1033, 1235, 1437, 1641]),
                           ('morningstar', (625, 646), [339, 559, 795, 1059, 1339, 1597]),
                           ('javelin', (847, 868), [296, 572, 812, 1040, 1316, 1598])]),
        'H1P2': dict(file='ART-27_HEAD-1_PAGE-2.png', names=[(20, 90, 114, 112), (20, 297, 75, 319), (20, 486, 111, 508), (20, 660, 93, 682),
                                                             (20, 867, 127, 889)],
                     rows=[('flinch', (170, 189), [263, 503, 733, 974]),
                           ('fall', (389, 411), [225, 445, 671, 888, 1136, 1393]),
                           ('prone', (565, 584), [281, 538]),
                           ('lurk', (740, 759), [247, 479, 694, 922]),
                           ('ambush', (964, 985), [253, 474, 687, 912, 1177, 1418])]),
        'H2P1': dict(file='ART-27_HEAD-2_PAGE-1.png', names=[(23, 129, 85, 152), (24, 367, 97, 390), (21, 611, 204, 639), (21, 837, 128, 859)],
                     rows=[('idle', (222, 243), [284, 498, 710, 927, 1145, 1361]),
                           ('walk', (459, 479), [205, 383, 557, 722, 909, 1071, 1248, 1423]),
                           ('morningstar', (717, 737), [287, 504, 703, 901, 1145, 1364]),
                           ('javelin', (968, 988), [249, 448, 673, 901, 1136, 1361])]),
        'H2P2': dict(file='ART-27_HEAD-2_PAGE-2.png', names=[(26, 102, 115, 123), (25, 301, 75, 322), (25, 508, 110, 529), (25, 671, 90, 693),
                                                             (24, 865, 127, 886)],
                     rows=[('flinch', (197, 217), [320, 618, 912, 1181]),
                           ('fall', (410, 433), [204, 441, 635, 872, 1121, 1385]),
                           ('prone', (592, 612), [255, 541]),
                           ('lurk', (756, 775), [330, 597, 839, 1088]),
                           ('ambush', (968, 988), [230, 447, 676, 886, 1154, 1392])]),
        'H3P1': dict(file='ART-27_HEAD-3_PAGE-1.png', names=[(26, 174, 90, 199), (26, 446, 133, 472), (26, 688, 104, 714)],
                     rows=[('fall', (281, 308), [232, 492, 748, 1040, 1331, 1625]),
                           ('prone', (540, 564), [312, 748]),
                           ('lurk', (811, 835), [260, 651, 1036, 1434])]),
        'H5P1': dict(file='ART-27_HEAD-5_PAGE-1.png', names=[(23, 106, 135, 133), (22, 342, 87, 368), (23, 554, 129, 580), (23, 753, 103, 780)],
                     rows=[('flinch', (197, 219), [346, 638, 903, 1161]),
                           ('fall', (434, 460), [247, 524, 757, 1024, 1305, 1591]),
                           ('prone', (632, 658), [311, 676]),
                           ('lurk', (838, 859), [327, 619, 907, 1188])])},
    'chief': {
        'H1P1': dict(file='ART-28_HEAD-1_PAGE-1.png', names=[(24, 102, 99, 130), (24, 302, 106, 329), (23, 531, 218, 562), (23, 729, 234, 760)],
                     rows=[('idle', (189, 211), [294, 527, 756, 999, 1235, 1472]),
                           ('walk', (400, 422), [253, 433, 625, 805, 1010, 1217, 1423, 1634]),
                           ('morningstar', (631, 652), [329, 561, 788, 995, 1266, 1521]),
                           ('morningstar2', (839, 861), [337, 544, 771, 1037, 1372, 1641])],   # (5 read at 1358: its ball, lunged out
                     fix={'morningstar2': [((955, 740, 968, 750), '3')]},      # to 1500, seeded 6) (a tip of frame 3's speed lines, by 4's shield)
                     touch_ok=('morningstar2',)),
        'H1P2': dict(file='ART-28_HEAD-1_PAGE-2.png', names=[(26, 101, 135, 127), (26, 281, 93, 307), (26, 450, 118, 475), (26, 594, 101, 620),
                                                             (26, 757, 145, 783)],
                     rows=[('flinch', (180, 201), [297, 549, 778, 1010]),
                           ('fall', (369, 391), [293, 531, 770, 1051, 1324, 1590]),
                           ('prone', (510, 537), [294, 605]),
                           ('lurk', (659, 685), [277, 518, 765, 1004]),
                           ('ambush', (852, 873), [277, 537, 789, 1036, 1361, 1641])]),
        'H2P1': dict(file='ART-28_HEAD-2_PAGE-1.png', names=[(24, 103, 100, 131), (24, 303, 105, 331), (23, 533, 208, 564), (23, 731, 227, 761)],
                     rows=[('idle', (190, 212), [299, 538, 797, 1058, 1321, 1576]),
                           ('walk', (402, 425), [253, 470, 637, 830, 1042, 1236, 1440, 1623]),
                           ('morningstar', (637, 659), [311, 530, 769, 988, 1265, 1507]),
                           ('morningstar2', (839, 861), [327, 550, 774, 1043, 1337, 1595])],
                     fix={'morningstar2': [((935, 716, 972, 744), '3')]},       # (a streak of frame 3's speed lines, by frame 4's shield)
                     touch_ok=('morningstar2',)),
        'H2P2': dict(file='ART-28_HEAD-2_PAGE-2.png', names=[(21, 92, 137, 119), (23, 280, 95, 305), (23, 442, 119, 467), (23, 590, 99, 616),
                                                             (23, 751, 137, 778)],
                     rows=[('flinch', (176, 197), [303, 567, 820, 1035]),
                           ('fall', (363, 385), [256, 529, 773, 1045, 1332, 1608]),
                           ('prone', (514, 535), [303, 584]),
                           ('lurk', (673, 694), [285, 544, 786, 1028]),
                           ('ambush', (851, 872), [259, 523, 765, 1028, 1312, 1599])]),
        'H3P1': dict(file='ART-28_HEAD-3_PAGE-1.png', names=[(30, 141, 100, 170), (30, 427, 131, 456), (30, 658, 107, 687)],
                     rows=[('fall', (307, 333), [260, 525, 785, 1053, 1339, 1629]),
                           ('prone', (543, 570), [322, 709]),
                           ('lurk', (802, 828), [290, 603, 905, 1209])]),
        'H5P1': dict(file='ART-28_HEAD-5_PAGE-1.png', names=[(31, 97, 244, 128), (31, 352, 175, 385), (31, 594, 215, 627), (31, 827, 185, 860)],
                     rows=[('flinch', (206, 230), [425, 660, 912, 1174]),
                           ('fall', (463, 492), [282, 495, 697, 908, 1139, 1370]),
                           ('prone', (687, 715), [436, 805]),
                           ('lurk', (938, 965), [383, 645, 908, 1168])])},
}
HEADS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1',), 'N': ('H5P1',)}
FACING = {'SE': (7, 1), 'NE': (5, 3), 'S': (0,), 'N': (4,)}       # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
ENGINE = {'idle': ('idle',), 'walk': ('walk',), 'morningstar': ('morningstar', 'attack'), 'morningstar2': ('morningstar2',),
          'javelin': ('javelin',), 'flinch': ('flinch',), 'fall': ('hurt',), 'prone': ('prone',), 'lurk': ('still',), 'ambush': ('ambush',)}
PLAY = {'prone': ['2', '1']}                 # (up off the ground, then lying, as the side's: js/ui.js lies at the last frame and rises back through it)
FLOOR = ('flinch', 'fall')                   # rows that start standing: the row's ground is its first frame's feet (a body lying toward the eye reaches
                                             # lower on the page); the others stand on the row's lowest point
# the scale, page px a game px. No turnaround on the pages: each page's standing bugbear to the views beside it as committed, by the square
# root of its filled area (the house's way since the hyena, 10-15: height lies -- the NE idles stand upright where E's and N's stoop). At game
# size the bugbear's side idle is sqrt-area 45.2 (52.5 tall), its front idle 48.3 (56.2), its back idle 45.5 (52.5); the chief's 39.0 (49.7),
# 45.9 (60.4), 45.5 (56.4). A diagonal page by its Idle against the two views beside it, a page 2 by its Fall 1 (standing, the idle's pose)
# and Flinch against its page 1's Idle; S and N (no idle drawn) by their standing frames -- S's Fall 1, N's Flinch -- against the old front
# and back idles, by area and by height, the mean of the two (as the Harbinger's S and N, 10-15: the art desk drew the cardinal pages more
# upright, so the two disagree there). The bugbear: H1P1 idle 134.3 against SE's neighbours' 46.75 -> 2.87 (height says 2.97); H1P2 Fall 1
# 0.963 of H1P1's idle -> 2.77; H2P1 idle 129.0 against 45.35 -> 2.85 (it stands 61 px, upright: height says 3.3); H2P2 Fall 1 0.99 -> 2.82;
# H3P1 Fall 1 151.5 / 197 px against the front idle -> 3.14 by area, 3.51 by height -> 3.32; H5P1 Flinch 134.4 / 162.5 against the back
# idle -> 2.95, 3.10 -> 3.02. The chief: H1P1 idle 132.0 against 42.45 -> 3.11 (2.98); H1P2 Flinch and Fall 1 0.99 -> 3.08; H2P1 idle 127.7
# against 42.25 -> 3.02 (3.03); H2P2 0.99 -> 2.99; H3P1 Fall 1 171.8 / 216 -> 3.74, 3.58 -> 3.66; H5P1 Flinch 140.7 / 178.8 -> 3.09, 3.17
# -> 3.13. (The morningstar's ball, a sphere, would be the rigid measure, but the art desk drew it a different size on every page.)
KP = {'bugbear': {'H1P1': 2.87, 'H1P2': 2.77, 'H2P1': 2.85, 'H2P2': 2.82, 'H3P1': 3.32, 'H5P1': 3.02},
      'chief': {'H1P1': 3.11, 'H1P2': 3.08, 'H2P1': 3.02, 'H2P2': 2.99, 'H3P1': 3.66, 'H5P1': 3.13}}
# the colour, page by page, to the side re-rolls' (they hold E and W, and the packed rows were toned to them in 10-07): the art desk drew a
# stronger, brighter orange, the more so on the later pages. The medians of the coloured pixels at game size (saturation over 0.2), hue /
# saturation / value: the bugbear's side rows 25.6 / 0.697 / 0.380, its pages H1P1 23.4 / 0.766 / 0.424, H1P2 23.6 / 0.794 / 0.439, H2P1
# 25.4 / 0.771 / 0.431, H2P2 25.4 / 0.850 / 0.514, H3P1 25.2 / 0.733 / 0.416, H5P1 22.9 / 0.842 / 0.427; the chief's side 24.1 / 0.652 /
# 0.365, H1P1 23.2 / 0.761 / 0.373, H1P2 22.3 / 0.816 / 0.376, H2P1 22.1 / 0.821 / 0.365, H2P2 21.3 / 0.891 / 0.404, H3P1 23.7 / 0.821 /
# 0.392, H5P1 21.2 / 0.926 / 0.416. Each page: the hue turned, the saturation and the value times a factor, to meet the side's (in HSV, as
# the hyena's: a per-channel tone moves the steel and the outline unevenly)
TONEP = {'bugbear': {'H1P1': (2.2, 0.909, 0.898), 'H1P2': (1.9, 0.877, 0.866), 'H2P1': (0.2, 0.904, 0.882), 'H2P2': (0.2, 0.820, 0.740),
                     'H3P1': (0.3, 0.950, 0.915), 'H5P1': (2.7, 0.828, 0.890)},
         'chief': {'H1P1': (0.9, 0.857, 0.979), 'H1P2': (1.9, 0.799, 0.969), 'H2P1': (2.0, 0.795, 1.000), 'H2P2': (2.8, 0.732, 0.903),
                   'H3P1': (0.4, 0.794, 0.930), 'H5P1': (3.0, 0.704, 0.877)}}


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX if k >= 1 else Image.LANCZOS)


def toned(img, f):
    a = np.asarray(img).astype(float)
    rgb = a[..., :3]
    grey = rgb.max(-1) - rgb.min(-1) < 25
    rgb[~grey] *= np.array(f, float)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def core_x(a):
    """x of the body's thick middle (the morningstar, the javelins and the limbs are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


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


def cut_page(look, L, check=False):
    """sheetrows over one ART-27/28 page -> {row: [(name, RGBA image, box)]}, the frames split by the numbers' x's as read, every number and
    row name dropped as text; each blob on the page goes to the row its centre lies in (above that row's numbers, below the row above's), and
    each row is cut from a strip of the page with every other row's blobs painted the navy"""
    import io
    s = PAGES[look][L]
    a = np.asarray(Image.open(os.path.join(ART[look], s['file'])).convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    text, hand = [(0, y0 - 6, x1 + 6, y1 + 6) for x0, y0, x1, y1 in s['names']], {}
    for row, (sy0, sy1), xs in s['rows']:
        text += [(int(x) - 22, sy0 - 6, int(x) + 22, sy1 + 7) for x in xs]    # (a number's soft drop shadow runs past its glyph)
    m = SR.figure_mask(a)
    SR.drop_text(m, text)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cy = np.array([c[0] for c in ndimage.center_of_mass(m, lab, range(1, n + 1))])
    owner = np.searchsorted([sy1 for _, (_, sy1), _ in s['rows']], cy)     # a blob's row: the first whose numbers lie below its centre
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
            buf = io.BytesIO(); Image.fromarray(b[Y0:Y1].astype(np.uint8)).save(buf, 'PNG'); buf.seek(0)
            hand[(0, sy0 - Y0)] = xs
            spec = dict(text=[(t[0], t[1] - Y0, t[2], t[3] - Y0) for t in text], rows=[(row, (0, 0, W, Y1 - Y0), (sy0 - Y0, sy1 - Y0), NUM(len(xs)))])
            o = [] if check else None
            fix = {row: [((x0, y0 - Y0, x1, y1 - Y0), to) for (x0, y0, x1, y1), to in s.get('fix', {}).get(row, ())]}
            got = SR.cut_sheet(buf, spec, fix=fix, touch_ok=s.get('touch_ok', ()), overlay=o, tag='%s %s' % (look, L))
            out.update({r: [(nm, im, (bx[0], bx[1] + Y0, bx[2], bx[3] + Y0)) for nm, im, bx in frs] for r, frs in got.items()})
            if check:
                over[Y0:Y1][mine[Y0:Y1]] = np.asarray(o[0])[mine[Y0:Y1]]
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'bugbear'); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).save(os.path.join(d, 'cut-%s-%s.png' % (look, L)))
    return out


def hsv_toned(im, t):
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


def heads(look, check=False):
    """ART-27/28's pages -> {view: {sheet row: [(1x RGBA array, its core x, px above the ground)]}}, each page at its own scale (KP) and tone
    (TONEP); a later page's row replaces an earlier one's"""
    views = {v: {} for v in HEADS}
    for v, pages in HEADS.items():
        for L in pages:
            k, t = KP[look][L], TONEP[look][L]
            for row, frs in cut_page(look, L, check).items():
                floor = frs[0][2][3] if row in FLOOR else max(b[3] for _, _, b in frs)
                if row in PLAY:
                    frs = [next(f for f in frs if f[0] == nm) for nm in PLAY[row]]
                seq = []
                for nm, im, box in frs:
                    a = pix.pixelate(game_size(hsv_toned(im, t), k), 1, do_lift=False)
                    seq.append((a, core_x(a), int(round((floor - box[3]) / k))))
                for eng in ENGINE[row]:
                    views[v][eng] = seq
    return views


def main(check=False):
    cuts = {look: cut(look, check) for look in IMAGES}
    hd = {look: heads(look, check) for look in PAGES}
    for name, L in LOOKS.items():
        look = L['look']
        def frames_of(src):
            row, names = src if isinstance(src, tuple) else (src, None)
            img, row = row.split(':') if ':' in row else (look, row)
            frs = cuts[img][row]
            floor = max(b[3] for _, _, b in frs)
            k = K[img][row.split('.')[0]]
            pick = [next(f for f in frs if f[0] == nm) for nm in names] if names else frs
            out = []
            for nm, im, box in pick:
                a = pix.pixelate(game_size(toned(im, TONE[img]) if img in TONE else im, k), 1, do_lift=False)
                out.append((a, core_x(a), int(round((floor - box[3]) / k))))
            return out
        src = {}
        for eng, by in L['rows'].items():
            side = frames_of(by['side'])
            src[eng] = [frames_of(by['S']) if f == 0 and 'S' in by else frames_of(by['N']) if f == 4 and 'N' in by else side for f in range(8)]
            for v, fs in FACING.items():                     # ART-27/28: SE and SW, NE and NW, and S and N where their pages drew the row
                if eng in hd[look][v]:
                    for f in fs:
                        src[eng][f] = hd[look][v][eng]
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
        meta['source'] = ('generated by Griz (2026-10-07: GPT, four sheets in one image, "%s"), cut by tools/bugbear-sheet.py'
                          % IMAGES[look]['file'][:-4])
        json.dump(meta, open(meta_p, 'w'), indent=1)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings():
    """dev/visions/bugbear/facings-<sheet>-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey
    floor (the foot's line drawn); lineup-<sheet>.png: idle frame 1 in all eight facings, 4x"""
    from PIL import ImageDraw
    d = os.path.join(ROOT, 'dev', 'visions', 'bugbear'); os.makedirs(d, exist_ok=True)
    for name in LOOKS:
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
        for row, an in m['anims'].items():
            fw, fh, n, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['frames'], an['y'], an.get('ay', m['ay'])
            cv = Image.new('RGBA', (fw * n + 4 * (n + 1), fh * 8), (70, 74, 70, 255))
            dr = ImageDraw.Draw(cv)
            for f in range(8):
                dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
                dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
                for i in range(n):
                    cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (4 + i * (fw + 4), f * fh))
            cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s-%s.png' % (name, row)))
        an = m['anims']['idle']
        fw, fh, y = an.get('fw', m['fw']), an.get('fh', m['fh']), an['y']
        cv = Image.new('RGBA', (fw * 8, fh), (70, 74, 70, 255))
        for f in range(8):
            cv.alpha_composite(im.crop((0, y + f * fh, fw, y + (f + 1) * fh)), (f * fw, 0))
        cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup-%s.png' % name))
    print('  wrote', d)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
    if 'check' in sys.argv[1:]:
        facings()
