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


def main(check=False):
    cuts = {look: cut(look, check) for look in IMAGES}
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


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
