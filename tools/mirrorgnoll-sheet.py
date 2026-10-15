"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets of the mirror-eyed gnoll -> mirrorgnoll_p1.

    python tools/mirrorgnoll-sheet.py            (writes deep16/art/mirrorgnoll_p1.png/.json)
    python tools/mirrorgnoll-sheet.py check      (also the cut overlays, dev/visions/mirrorgnoll/cut-<n>.png, and a lineup beside the gnolls)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Mirror-Eyed Gnoll Sprite Sheet1.png and
Mirror-Eyed Gnoll Action Sprite Sheet2.png -- Griz, 2026-10-08, drawn from the GPT "Astra" draft's two prompts
(deep16/_src/oneeye/astra-draft-2026-10-08.md: its rows and its look); then deep16/_src/mirrorgnoll/Hunched mirror-eyed gnoll sprite
sheet-1.png (from the front) and Back-View Gnoll Animation Sprite Sheet-3.png (from behind; its sheet-2 dropped an idle frame and swung
the other arm, and this re-roll fixed both), with Back-view mirror-eyed gnoll sprite sheet-2.png's backhand kept as the other arm's
(Griz, 10-08: "if we want to make him do a dance, one has his arm out to one side and the other has the other arm out to a side ...
That's why I thought we needed all 3") -- the seat's lean pasted (10-08: front and back, Idle 6, Walk 8, Backhand 6, Flinch 4, mirrors
in both eyes). Not the Old One's vessel (Griz, 10-08: "he's not gonna be the old
one's avatar - but maybe something the Old One did to another gnoll whilst about on his walk to the Doors"): a spotted gnoll with a mirror
for an eye, no heart glass, no stars -- cut as drawn. His kit is not ruled; every row is cut, under the draft's names, for the kit to pick
(the draft's notes on how the game should play its rows are in the bestiary lane, ../handoff-2026-10-05-the-bestiary-after-the-bugs.md).

Sheets 1 and 2: a portrait and a turnaround (front, right, back, left), then rows facing RIGHT, labelled by number. Sheet 1: idle 6, walk 8,
backhand 6, drain 8 (Drink Light), flinch 4, fall 8. Sheet 2: foretell 6, mirrorstrike 6 (numbered 1-5 and 8 by the generator), kneel 8,
overfill 6, ascend 9 (two 7s), uprightidle 6 -- the last three-quarters to the front, standing tall. Sheets 3 (the front) and 4 (behind):
idle 6, walk 8, backhand 6, flinch 4, no turnaround.
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored (the mirror eye swaps sides with them, as every gnoll's does);
S takes sheet 3's rows and N sheet 4's for idle, walk, backhand (and attack) and flinch; the other rows play side-on from S and N too (as
the hobgoblin's climb and fall). `backhand2` is the other arm: from behind sheet 5's (back sheet 2), from the front the front's backhand
mirrored, side-on the side's (battle.js plays it on a backhand's second use in a turn, as the sergeant's longsword2; a dance can trade them).
`attack` is the backhand, `hurt` the fall; `prone` is the fall's two
going-down frames (his side, then the arm under him), got up from by playing them back (deep16/js/sprites.js S.proneRow, the hobgoblin's way).
Scale: the side idle (hunched) stands HEIGHT px; sheet 2 meets sheet 1 by the hunched guard both draw (sheet 1's idle against the first
frame of sheet 2's foretell, mirrorstrike, kneel, overfill and ascend, by area); the turnaround meets sheet 2 by its front against the
upright idle, by area; sheets 3 and 4 meet the turnaround by their idles against its front and its back, by area. The mirror eye and the cyan streaks are a pixel or two at game size: GLINT keeps them (a game pixel whose block
on the sheet holds the glint takes the glint's colour) so the box filter doesn't wash them into the fur. Colour: each later sheet drew him
warmer than sheet 1 (the most-played rows), so each is brought to sheet 1's per channel (TONE, the goose's and the bugbears' way).
THE MANE RIPPLE READS THESE COLOURS (ec0206f): deep16/js/ripple.js finds his mane as the dark silver ramp (silver 0-3) at the top of
the figure. A re-cut that moves TONE, the palette snap or the mane's colours can lose the mane: open the ripple's door after it
(tools/sheet-play.html?sheet=mirrorgnoll_p1&face=6,0,4&ripple=mane&tones=moss&bg=moss&every=1.5) and see the wave still runs down the mane.

ART-31 (2026-10-15, the art desk's five views -- RULED 10-14, a figure is five drawn views, SE mirroring to SW, E to W, NE to NW): a PARTIAL
delivery in deep16/_src/mirrorgnoll/ART-31/ (the art desk's papers in _src/art-desk/received-2026-10-15-ART-31/, ART-31-CUTTER-NOTES.md
first): PRESERVED_SELECTED/'s nine pages and SPLIT_ROW_REPAIRS_REVIEW/'s nine repair pages, A/B/C a row or two each (never one row's
frames run on). USE31 names the pages cut in; the rest wait on Griz. Cut by their own number strips (cut31: each blob to the row its
centre lies in, each row cut from the page with the others painted out), scaled by area to his old guard (scales31; S and N also by
height to sheets 3 and 4), the upright rows at one height in every view (U), toned to sheet 1 by saturation and value (tones31: the mane
left be). V31 says which view of which row each page gives; a view no page in USE31 gives plays what it did before (the head of this
file). Row names as the assignment's: Fall plays `hurt` (and `prone`, its frames 4 and 5), Kneel `kneel` and `cast` (one drawing: the
sheet marks `kneel` the same as `cast`, the engine plays `cast`), Pounce `pounce` with its blow on frame 6. Sheet 2's three-quarter
Upright Idle stays at SE and SW (the assignment's handoff: HEAD 1 has none); E gets HEAD 4's profile. `check` also writes every facing of
every row (dev/visions/mirrorgnoll/facings-<row>.png) and each page's cut (cut31-<page>.png).
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

FILES = {1: 'Mirror-Eyed Gnoll Sprite Sheet1.png', 2: 'Mirror-Eyed Gnoll Action Sprite Sheet2.png',
         3: os.path.join('mirrorgnoll', 'Hunched mirror-eyed gnoll sprite sheet-1.png'), 4: os.path.join('mirrorgnoll', 'Back-View Gnoll Animation Sprite Sheet-3.png'),
         5: os.path.join('mirrorgnoll', 'Back-view mirror-eyed gnoll sprite sheet-2.png'),
         6: os.path.join('mirrorgnoll', 'Mirror gnoll pounce attack sprite sheet-1.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 285, 160, 1024)], portrait=(0, 0, 290, 285),
          rows=[('turn', (350, 0, 1300, 258), (258, 281), TURN, [460, 696, 954, 1199]),
                ('idle', (0, 281, 1536, None), (404, 418), NUM(6), [233, 400, 575, 744, 916, 1089]),
                ('walk', (0, None, 1536, None), (536, 550), NUM(8), [233, 387, 535, 685, 839, 988, 1146, 1303]),
                ('backhand', (0, None, 1536, None), (665, 679), NUM(6), [233, 409, 587, 778, 983, 1155]),
                ('drain', (0, None, 1536, None), (792, 805), NUM(8), [233, 395, 564, 734, 906, 1072, 1244, 1411]),
                ('flinch', (0, None, 1536, None), (902, 916), NUM(4), [233, 417, 591, 770]),
                ('fall', (0, None, 1536, None), (1004, 1017), NUM(8), [179, 330, 491, 655, 836, 1021, 1207, 1407])]),
  2: dict(text=[(0, 282, 170, 1024)], portrait=(0, 0, 290, 282),
          rows=[('turn', (350, 0, 1300, 250), (250, 271), TURN, [458, 696, 957, 1200]),
                ('foretell', (0, 271, 1536, None), (385, 399), NUM(6), [245, 433, 661, 873, 1077, 1276]),
                ('mirrorstrike', (0, None, 1536, None), (503, 516), NUM(6), [245, 427, 649, 884, 1129, 1307]),
                ('kneel', (0, None, 1536, None), (622, 636), NUM(8), [229, 382, 553, 722, 903, 1078, 1243, 1428]),
                ('overfill', (0, None, 1536, None), (742, 756), NUM(6), [241, 438, 648, 856, 1061, 1285]),
                ('ascend', (0, None, 1536, None), (873, 887), NUM(9), [234, 398, 556, 724, 888, 1037, 1171, 1305, 1442]),
                ('uprightidle', (0, None, 1536, None), (1006, 1019), NUM(6), [251, 458, 664, 876, 1079, 1289])]),
  3: dict(text=[(0, 0, 170, 1024)],
          rows=[('idle', (0, 0, 1536, None), (244, 261), NUM(6), [266, 492, 705, 915, 1130, 1345]),
                ('walk', (0, None, 1536, None), (487, 504), NUM(8), [221, 399, 564, 732, 907, 1081, 1254, 1426]),
                ('backhand', (0, None, 1536, None), (736, 752), NUM(6), [270, 484, 682, 929, 1161, 1371]),
                ('flinch', (0, None, 1536, None), (982, 998), NUM(4), [309, 544, 775, 999])]),
  4: dict(text=[(0, 0, 170, 1024)],
          rows=[('idle', (0, 0, 1536, None), (246, 263), NUM(6), [268, 492, 709, 929, 1152, 1378]),
                ('walk', (0, None, 1536, None), (487, 504), NUM(8), [219, 397, 573, 732, 907, 1085, 1260, 1427]),
                ('backhand', (0, None, 1536, None), (735, 752), NUM(6), [270, 487, 730, 938, 1156, 1371]),
                ('flinch', (0, None, 1536, None), (984, 1001), NUM(4), [294, 535, 760, 996])]),
  6: dict(text=[(0, 0, 110, 1024)],                                       # the Pounce from every side: front, back, right, LEFT (drawn)
          rows=[('pf', (0, 0, 1536, None), (262, 280), NUM(8), [195, 383, 569, 747, 922, 1093, 1271, 1442]),
                ('pb', (0, None, 1536, None), (514, 534), NUM(8), [192, 383, 573, 747, 924, 1094, 1272, 1442]),
                ('pr', (0, None, 1536, None), (737, 758), NUM(8), [194, 379, 556, 734, 912, 1087, 1264, 1441]),
                ('pl', (0, None, 1536, None), (965, 984), NUM(8), [195, 383, 563, 751, 924, 1097, 1277, 1449])]),
  5: dict(text=[(0, 0, 170, 1024)],                                       # (only its backhand: the other arm)
          rows=[('backhand', (0, 506, 1536, None), (735, 752), NUM(6), [270, 487, 695, 928, 1155, 1366])]),   # (below the walk's numbers)
}
SPLIT = {(2, 'ascend'): 741,       # (sheet, row) -> the line between it and the row above, by hand where the two crowd: overfill's feet
         (2, 'uprightidle'): 872}  # end at 739 and ascend 9's head starts at 744; ascend's feet end at 870 and the upright heads start at 873
# a number that touches a head (so it is not wholly inside its strip): its white glyph and its dark shadow painted navy before the cut
ERASE = {2: [(882, 871, 896, 889), (1299, 871, 1313, 889)]}   # ascend's "5" on upright idle 4's head, its second "7" on upright idle 6's
# painted navy whole before the cut: the portraits' last rows inside the first row's band (sheet 2's a red rule), and specks of ground shadow
BLANK = {1: [(0, 276, 300, 287)],
         2: [(0, 266, 300, 284), (888, 379, 895, 381), (1091, 379, 1099, 381), (639, 626, 652, 629), (1034, 868, 1040, 869), (805, 442, 806, 443)]}
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)] -- the streaks' faint tips lie
# nearer the next frame's tail than their own muzzle
FIX = {1: {'drain': [((460, 694, 512, 722), '2'), ((628, 694, 682, 722), '3')]},
       2: {'mirrorstrike': [((784, 427, 822, 447), '3')]}}
CUT = {}
TOUCH_OK = {1: {'drain'}, 2: {'mirrorstrike'}, 6: {'pf', 'pb', 'pl'}}   # (6: a foot at the next frame's impact dust)   # looked at: drain 2's streaks by drain 3's tail, mirrorstrike 3's claw by 4's tail, each cut right

# the engine's rows: (sheet, row) for the side; S and N as described in the head
FRONT, BACK = ('idle', 'walk', 'backhand', 'flinch'), ('idle', 'walk', 'backhand', 'flinch')   # sheet 3's rows for S, sheet 4's for N
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'attack': (1, 'backhand'), 'backhand': (1, 'backhand'), 'backhand2': (1, 'backhand'), 'drain': (1, 'drain'),
        'flinch': (1, 'flinch'), 'hurt': (1, 'fall'), 'prone': (1, 'fall'), 'foretell': (2, 'foretell'), 'mirrorstrike': (2, 'mirrorstrike'),
        'pounce': (6, 'pr'), 'kneel': (2, 'kneel'), 'cast': (2, 'kneel'), 'overfill': (2, 'overfill'), 'ascend': (2, 'ascend'), 'uprightidle': (2, 'uprightidle')}
# (cast: his Kneel, Hold Person's pose -- magic.js M.cast plays a sheet's `cast` row)
PRONE = [3, 4]        # the fall's frames 4 and 5 (an arm under him; on his side): lying at the last, got up from by playing it back
NEW = ['backhand', 'backhand2', 'pounce', 'drain', 'foretell', 'mirrorstrike', 'kneel', 'overfill', 'ascend', 'uprightidle']   # this cutter's own rows (named
                                                                                                         # here, not in pixelate.py)
FPS = {'cast': 7, 'idle': 5, 'walk': 9, 'attack': 10, 'backhand': 10, 'backhand2': 10, 'pounce': 10, 'drain': 8, 'flinch': 8, 'hurt': 8, 'prone': 8, 'foretell': 6,
       'mirrorstrike': 11, 'kneel': 7, 'overfill': 7, 'ascend': 6, 'uprightidle': 5}
# per channel, each sheet's figure brought to sheet 1's: mean RGB against sheet 1's turnaround view of the same side (sheet 2's turnaround,
# 111 74 56, to sheet 1's, 99 70 56; the front, 109 73 55, to its front; behind, 122 77 52 and 116 74 53, to its back, 99 70 58), 10-08
TONE = {2: (0.893, 0.947, 1.0), 3: (0.907, 0.964, 1.033), 4: (0.813, 0.909, 1.11), 5: (0.859, 0.943, 1.085),
        6: (0.888, 0.958, 1.05)}   # (the Pounce: each row's guard frames against sheet 1's turnaround view of its side, averaged)
IMPACT = 5            # the Pounce's frame 6 (0-based 5): "Frame 6 is impact -- trigger damage and the target's prone animation there;
                      # frames 7-8 follow through and recover" (Griz, 10-08)
HEIGHT = 64           # the hunched side idle, standing px (the glory-seeker's 64; the house gnoll 60) -- his size is unruled
FH, AY = 112, 100

# ART-31 (2026-10-15): the art desk's five views (RULED 10-14, a figure is five drawn views: SE mirrors to SW, E to W, NE to NW), in
# deep16/_src/mirrorgnoll/ART-31/ (its papers in _src/art-desk/received-2026-10-15-ART-31/, ART-31-CUTTER-NOTES.md first). A PARTIAL
# delivery: PRESERVED_SELECTED/ holds nine selected pages, SPLIT_ROW_REPAIRS_REVIEW/ nine repair pages that wait on Griz's eye (the art
# desk: "Do not automatically approve review images"); a page is cut only when it is in USE31. Per page: its file, its row names' boxes
# (lettering), and its rows -- (row, the number strip y0 y1, the numbers' x centres), read off the page (white glyphs, by row; the mirror
# eyes' glints are white too, a strip higher). A row's band runs from the strip above to its own; its numbers are dropped as text and
# its frames are cut left to right by those x's -- never by the digits printed (H3P2's Overfill prints 1,2,3,4,6,6: six drawings).
P31 = os.path.join('mirrorgnoll', 'ART-31', 'PRESERVED_SELECTED')
R31 = os.path.join('mirrorgnoll', 'ART-31', 'SPLIT_ROW_REPAIRS_REVIEW')
N31 = os.path.join('mirrorgnoll', 'ART-31-NEROWS')        # (ART-31 supplement 1, 10-15: NE's Backhand, Mirror Strike and Overfill asked again;
                                                          # their near hand drawn blue-black enough that the default test keyed it lacy: `fill`)
ART31 = {
  # HEAD 1, SE (SW mirrored)
  'H1P1': dict(file=os.path.join(P31, 'ART-31_HEAD-1_PAGE-1.png'), names=[(14, 132, 90, 166), (14, 368, 92, 404), (14, 604, 150, 640), (14, 812, 150, 860)],
               rows=[('idle', (251, 269), [255, 456, 656, 856, 1051, 1248]),
                     ('walk', (478, 497), [203, 370, 540, 708, 885, 1059, 1240, 1419]),
                     ('backhand', (718, 736), [253, 454, 659, 879, 1091, 1297]),
                     ('drain', (943, 961), [214, 380, 552, 719, 893, 1064, 1242, 1421])], streaks=('drain',)),
  'H1P2': dict(file=os.path.join(P31, 'ART-31_HEAD-1_PAGE-2.png'), names=[(14, 120, 100, 152), (14, 330, 70, 370), (14, 592, 104, 630), (14, 844, 116, 876)],
               rows=[('flinch', (220, 236), [214, 429, 634, 849]),
                     ('fall', (448, 486), [152, 320, 486, 672, 867, 1058, 1239, 1427]),
                     ('pounce', (710, 734), [184, 352, 518, 690, 876, 1076, 1263, 1441]),
                     ('foretell', (955, 977), [220, 435, 663, 886, 1126, 1346])],
               cut={'pounce': [[(967, 615), (976, 660), (979, 708)]]}),     # Pounce 5's claw drawn over the edge of 6's dust cloud
  'H1P3': dict(file=os.path.join(P31, 'ART-31_HEAD-1_PAGE-3.png'), names=[(14, 118, 172, 156), (14, 358, 96, 390), (14, 588, 120, 620), (14, 828, 108, 860)],
               rows=[('mirrorstrike', (213, 232), [270, 472, 705, 950, 1173, 1384]),
                     ('kneel', (454, 472), [226, 394, 558, 725, 901, 1075, 1243, 1406]),
                     ('overfill', (693, 709), [251, 482, 694, 911, 1134, 1357]),
                     ('ascend', (961, 982), [191, 349, 507, 654, 817, 963, 1112, 1277, 1445])],
               fix={'mirrorstrike': [((1035, 140, 1079, 205), '4')]}),     # Mirror Strike 4's cyan accents, their tips nearer 5
  # HEAD 2, NE (NW mirrored); its PAGE 1 and PAGE 3 were BLOCKED and come back as the review's A/B/C pages, each a complete row or two
  'H2P1A': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-1A.png'), names=[(14, 280, 76, 316), (14, 618, 88, 654)],
                rows=[('idle', (393, 411), [213, 432, 640, 853, 1057, 1269]),
                      ('walk', (742, 759), [182, 355, 525, 703, 878, 1056, 1239, 1413])]),
  'H2P1B': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-1B.png'), names=[(14, 320, 168, 362)],
                rows=[('backhand', (539, 563), [298, 619, 947, 1284, 1626, 1972])]),
  'H2P1C': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-1C.png'), names=[(14, 340, 192, 384)],
                rows=[('drain', (516, 537), [278, 526, 756, 989, 1232, 1475, 1735, 1988])], streaks=('drain',)),
  'H2P2': dict(file=os.path.join(P31, 'ART-31_HEAD-2_PAGE-2.png'), names=[(14, 128, 104, 162), (14, 360, 74, 394), (14, 604, 110, 636), (14, 846, 122, 878)],
               rows=[('flinch', (234, 250), [236, 467, 686, 900]),
                     ('fall', (466, 483), [161, 340, 505, 686, 872, 1056, 1236, 1420]),
                     ('pounce', (723, 739), [176, 335, 502, 672, 858, 1040, 1235, 1414]),
                     ('foretell', (974, 990), [227, 449, 682, 912, 1148, 1382])]),
  'H2P3A': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-3A.png'), names=[(14, 308, 250, 350)],
                rows=[('mirrorstrike', (514, 540), [311, 633, 936, 1315, 1676, 1985])]),
  'H2P3B': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-3B.png'), names=[(14, 318, 124, 360)],
                rows=[('kneel', (523, 546), [246, 493, 739, 988, 1245, 1500, 1754, 2004])]),
  'H2P3C': dict(file=os.path.join(R31, 'ART-31_HEAD-2_PAGE-3C.png'), names=[(14, 270, 160, 312)],
                rows=[('overfill', (522, 550), [288, 614, 958, 1303, 1627, 1968])]),
  'H2P5': dict(mask={'fill': 16}, file=os.path.join(N31, 'ART-31_HEAD-2_PAGE-5.png'), names=[(14, 326, 192, 366)],
               rows=[('backhand', (519, 546), [332, 633, 934, 1251, 1582, 1899])]),
  'H2P6': dict(mask={'fill': 16}, file=os.path.join(N31, 'ART-31_HEAD-2_PAGE-6.png'), names=[(14, 320, 232, 360)],
               rows=[('mirrorstrike', (517, 543), [315, 615, 939, 1315, 1694, 1991])], streaks=('mirrorstrike',)),   # (4's claw accents lie nearer 5)
  'H2P7': dict(mask={'fill': 16}, file=os.path.join(N31, 'ART-31_HEAD-2_PAGE-7.png'), names=[(14, 356, 156, 396)],
               rows=[('overfill', (560, 586), [293, 597, 939, 1277, 1606, 1918])]),
  'H2P4': dict(file=os.path.join(P31, 'ART-31_HEAD-2_PAGE-4.png'), names=[(20, 130, 136, 166), (20, 558, 210, 602)],
               rows=[('ascend', (443, 460), [96, 270, 439, 606, 777, 947, 1118, 1283, 1442]),
                     ('uprightidle', (870, 890), [293, 482, 672, 861, 1056, 1251])]),
  # HEAD 3, S
  'H3P1': dict(file=os.path.join(P31, 'ART-31_HEAD-3_PAGE-1.png'), names=[(14, 142, 142, 178), (14, 366, 68, 398), (14, 596, 116, 628), (14, 836, 154, 868)],
               rows=[('drain', (253, 270), [210, 374, 537, 691, 854, 1019, 1192, 1369]),
                     ('fall', (467, 484), [177, 335, 493, 660, 857, 1037, 1221, 1414]),
                     ('foretell', (714, 730), [218, 440, 666, 899, 1126, 1357]),
                     ('mirrorstrike', (947, 963), [240, 450, 672, 924, 1182, 1396])],
               fix={'mirrorstrike': [((1060, 855, 1101, 902), '4')]}),     # (the same)
  'H3P2': dict(file=os.path.join(P31, 'ART-31_HEAD-3_PAGE-2.png'), names=[(14, 140, 84, 170), (14, 366, 106, 398), (14, 614, 94, 646), (14, 854, 148, 888)],
               rows=[('kneel', (247, 264), [214, 391, 554, 725, 895, 1064, 1230, 1401]),
                     ('overfill', (485, 502), [248, 444, 673, 907, 1134, 1350]),          # (printed 1 2 3 4 6 6: the fifth drawing is frame 5)
                     ('ascend', (736, 753), [213, 373, 526, 675, 830, 983, 1132, 1283, 1432]),
                     ('uprightidle', (984, 1000), [243, 452, 674, 896, 1119, 1340])]),
  # HEAD 4, E (W mirrored): Upright Idle only, its name on the numbers' line
  'H4P1': dict(file=os.path.join(P31, 'ART-31_HEAD-4_PAGE-1.png'), names=[(20, 628, 240, 680)],
               rows=[('uprightidle', (635, 673), [302, 621, 949, 1262, 1594, 1922])]),
  # HEAD 5, N
  'H5P1': dict(file=os.path.join(P31, 'ART-31_HEAD-5_PAGE-1.png'), names=[(10, 108, 140, 144), (10, 358, 66, 390), (10, 590, 104, 620), (10, 824, 158, 856)],
               rows=[('drain', (256, 270), [202, 368, 522, 688, 852, 1031, 1226, 1406]),
                     ('fall', (493, 508), [178, 345, 505, 683, 858, 1053, 1228, 1419]),
                     ('foretell', (732, 746), [242, 466, 700, 921, 1146, 1377]),
                     ('mirrorstrike', (967, 981), [256, 471, 703, 956, 1184, 1393])]),
  'H5P2A': dict(file=os.path.join(R31, 'ART-31_HEAD-5_PAGE-2A.png'), names=[(14, 336, 116, 374)],
                rows=[('kneel', (492, 517), [261, 510, 757, 993, 1239, 1488, 1747, 2000])]),
  'H5P2B': dict(file=os.path.join(R31, 'ART-31_HEAD-5_PAGE-2B.png'), names=[(66, 52, 324, 118)],      # (its name above the row, not beside it)
                rows=[('overfill', (525, 554), [199, 533, 886, 1267, 1620, 1970])]),
  'H5P2C': dict(file=os.path.join(R31, 'ART-31_HEAD-5_PAGE-2C.png'), names=[(14, 122, 124, 158), (14, 480, 210, 524)],
                rows=[('ascend', (365, 385), [158, 356, 540, 730, 916, 1108, 1297, 1483, 1663]),
                      ('uprightidle', (775, 798), [332, 572, 804, 1038, 1272, 1513])]),
}


def cut31(L, check=False):
    """sheetrows over one ART-31 page -> {row: [(name, RGBA image, box)]}, the frames split by the numbers' x's as read (not by the
    digits), every number and row name dropped as text. The rows crowd (H3P2's Ascend heads rise between Overfill's numbers, H1P2's
    Pounce leaps up to the Fall row's), so a band is no fence: each blob on the page goes to the row its centre lies in (above that
    row's numbers, below the row above's), and each row is cut from a copy of the page with every other row's blobs painted the navy."""
    import io
    s = ART31[L]
    path = os.path.join(SRC, s['file'])
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    text, hand = [(x0 - 4, y0 - 4, x1 + 4, y1 + 4) for x0, y0, x1, y1 in s['names']], {}
    for row, (sy0, sy1), xs in s['rows']:
        hand[(0, sy0)] = xs
        text += [(int(x) - 20, sy0 - 5, int(x) + 20, sy1 + 6) for x in xs]   # (a number's soft drop shadow runs past its glyph)
    mk = dict(s.get('mask', {}))
    fill = mk.pop('fill', None)
    m = SR.figure_mask(a, mk.get('grey', 20), mk.get('far', 150), None if fill else mk.get('chan'))
    if fill:                     # (a mask's `fill`: the channel test only inside his own silhouette -- a hand drawn blue-black, which the
        cm = SR.figure_mask(a, chan=fill)   # default test keys as navy -- and the drop shadow outside it painted navy before the cut)
        sil = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=3))
        shadow = cm & ~m & ~sil
        m = m | (cm & sil)
        mk['chan'] = fill
    SR.drop_text(m, text)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cy = np.array([c[0] for c in ndimage.center_of_mass(m, lab, range(1, n + 1))])
    bottoms = [sy1 for _, (_, sy1), _ in s['rows']]
    owner = np.searchsorted(bottoms, cy)                  # a blob's row: the first whose numbers lie below its centre
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    orig = SR.label_xs
    SR.label_xs = lambda a_, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a_, x0, x1, y0, y1)
    out, over = {}, (a * 0.25).astype(np.uint8) if check else None
    gm = glint_mask(a) & m
    try:
        for k, (row, (sy0, sy1), xs) in enumerate(s['rows']):
            mine = np.isin(lab, 1 + np.where(owner == k)[0])
            b = a.copy()
            b[m & ~mine] = navy
            if fill:
                b[shadow] = navy
            fix = list(s.get('fix', {}).get(row, ()))
            if row in s.get('streaks', ()):              # the drain's streaks point back at the frame they leave: each streak to the frame
                glab, gn = ndimage.label(ndimage.binary_dilation(gm & mine, iterations=3))   # on its left (right-facing pages)
                for sl in ndimage.find_objects(glab):
                    gx = (sl[1].start + sl[1].stop) / 2.0
                    left = [i for i, x in enumerate(xs) if x < gx]
                    if left:
                        fix.append(((sl[1].start - 4, sl[0].start - 4, sl[1].stop + 4, sl[0].stop + 4), str(left[-1] + 1)))
            # cut from a strip of the page round this row's own blobs (sheetrows grows each frame over its whole image): every y shifted
            ys = np.where(mine.any(1))[0]
            Y0, Y1 = max(0, min(ys[0], sy0) - 8), min(H, max(ys[-1], sy1) + 8)
            sh = lambda bx: (bx[0], bx[1] - Y0, bx[2], bx[3] - Y0)
            buf = io.BytesIO(); Image.fromarray(b[Y0:Y1].astype(np.uint8)).save(buf, 'PNG'); buf.seek(0)
            hand[(0, sy0 - Y0)] = xs
            spec = dict(text=[sh(t) for t in text], rows=[(row, (0, 0, W, Y1 - Y0), (sy0 - Y0, sy1 - Y0), NUM(len(xs)))], **mk)
            cuts = {r: [[(x, y - Y0) for x, y in line] for line in lines] for r, lines in s.get('cut', {}).items()}
            o = [] if check else None
            got = SR.cut_sheet(buf, spec, fix={row: [(sh(bx), to) for bx, to in fix]}, cuts=cuts, touch_ok=s.get('touch_ok', ()), overlay=o, tag=L)
            out.update({r: [(nm, im, (bx[0], bx[1] + Y0, bx[2], bx[3] + Y0)) for nm, im, bx in frs] for r, frs in got.items()})
            if check:
                over[Y0:Y1][mine[Y0:Y1]] = np.asarray(o[0])[mine[Y0:Y1]]
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mirrorgnoll'); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).save(os.path.join(d, 'cut31-%s.png' % L))
    return out


def glint_mask(rgb):
    """the mirror's cold glint and the cyan streaks: bright, blue and green well over red"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (b - r > 50) & (g - r > 30) & ((r + g + b) / 3 > 140)


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined, its glint kept"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    a = pix.pixelate(small, 1, do_lift=False)
    src = np.asarray(im)
    gm = glint_mask(src[..., :3]) & (src[..., 3] > 0)
    if gm.any():
        H, W = a.shape[:2]
        ys, xs = np.where(gm)
        gy = np.clip((ys * H / src.shape[0]).astype(int), 0, H - 1)
        gx = np.clip((xs * W / src.shape[1]).astype(int), 0, W - 1)
        cnt = np.zeros((H, W), int); np.add.at(cnt, (gy, gx), 1)
        hit = cnt >= max(2, int(0.18 * k * k))                    # a fifth of the block or so is glint
        if hit.any():
            col = np.zeros((H, W, 3)); np.add.at(col, (gy, gx), src[ys, xs, :3].astype(float))
            col = col[hit] / cnt[hit][:, None]
            snapped = pix.snap(col[None] / 255.0)[0]
            a[hit, :3] = snapped
            a[hit, 3] = 255
    return a


def muzzle(a):
    """(x, y) of the muzzle's tip in a frame: the body's rightmost pixel in its upper rows"""
    rows = np.where(a.any(1))[0]
    top = a.copy(); top[rows[0] + (rows[-1] - rows[0]) * 45 // 100:] = False
    ys, xs = np.where(top)
    tip = xs.max()
    return float(tip), float(ys[xs >= tip - 2].mean())


def drink_in(frs):
    """Drink Light, the light going IN as he grows (Griz, 10-08: "The mirror drain is backwards, i.e. the energy going in appears to make
    him smaller, and if you reverse it, it'll look like energy going out makes him bigger"): the sheet's frames 2-6 sink lower as the streaks
    shorten into the eye, so the bodies play in the other order (the lowest brace first, rising), each with the streaks of its place in the
    row set at the same distance from its own muzzle; frames 1, 7 and 8 as drawn."""
    parts = []
    for nm, im, box in frs:
        a = np.asarray(im)
        lab, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
        big = 1 + int(np.argmax(ndimage.sum(a[..., 3] > 0, lab, range(1, n + 1))))
        parts.append((a, lab == big, box))
    out = list(frs)
    for i in range(1, 6):
        (ab, mb, bb), (as_, ms, bs) = parts[6 - i], parts[i]
        mx_b, my_b = muzzle(mb); mx_s, my_s = muzzle(ms)
        dx = int(round(bb[0] + mx_b - bs[0] - mx_s)); dy = int(round(bb[1] + my_b - bs[1] - my_s))
        streak = (as_[..., 3] > 0) & ~ms
        ys, xs = np.where(streak)
        sx, sy = xs + bs[0] + dx, ys + bs[1] + dy                      # the streaks' pixels on the sheet, moved to the body's muzzle
        X0, Y0 = min(bb[0], sx.min()), min(bb[1], sy.min())
        X1, Y1 = max(bb[2], sx.max() + 1), max(bb[3], sy.max() + 1)
        cv = np.zeros((Y1 - Y0, X1 - X0, 4), np.uint8)
        body = ab.copy(); body[~mb] = 0
        cv[bb[1] - Y0:bb[3] - Y0, bb[0] - X0:bb[2] - X0] = body
        cv[sy - Y0, sx - X0] = as_[ys, xs]
        out[i] = (frs[i][0], Image.fromarray(cv, 'RGBA'), (X0, Y0, X1, bb[3]))   # (the foot is the body's: the row's floor reads box[3])
    return out


def core_x(a):
    """x of the body's thick middle (torso and head; the arms and the streaks are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled) and its height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def place(a, x_ref, up, fw, ax, fh=FH):
    """a 1x RGBA array onto an fw x fh frame: x_ref at ax, the lowest opaque row `up` px above AY (below it, if `up` is negative)"""
    out = np.zeros((fh, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
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
    path = os.path.join(SRC, FILES[L])
    if L in ERASE or L in BLANK:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in ERASE.get(L, ()):
            box = img[y0:y1, x0:x1].astype(int)
            glyph = (box.mean(-1) > 140) | ((box[..., 2] >= box[..., 0]) & (box.mean(-1) > 50))   # the white number, its soft edge over the
            img[y0:y1, x0:x1][glyph] = navy                                                         # navy and over the dark mane
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'mirrorgnoll-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mirrorgnoll'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    guard2 = float(np.median([body(c[2][r][0][1])[0] for r in ('foretell', 'mirrorstrike', 'kneel', 'overfill', 'ascend')]))
    k2 = k1 * guard2 / med(c[1]['idle'])
    turn2 = {nm: body(im)[0] for nm, im, _ in c[2]['turn']}
    kt = k2 * turn2['front'] / med(c[2]['uprightidle'])
    k3 = kt * med(c[3]['idle']) / turn2['front']
    k4 = kt * med(c[4]['idle']) / turn2['back']
    guard = lambda L: float(np.median([body(c[L]['backhand'][i][1])[0] for i in (0, -1)]))   # (the backhand's first and last: the guard)
    k5 = k4 * guard(5) / guard(4)
    up_h = med(c[2]['uprightidle'], 1) / k2
    print('  K: sheet 1 %.2f, sheet 2 %.2f (its guard %.3f of sheet 1\'s), turnaround %.2f, front %.2f, back %.2f; the side idle %d px, '
          'upright %.0f px, from the front %.0f px, from behind %.0f px'
          % (k1, k2, k2 / k1, kt, k3, k4, HEIGHT, up_h, med(c[3]['idle'], 1) / k3, med(c[4]['idle'], 1) / k4))
    # sheet 6 (the Pounce): each row's first frame stands as that side's guard -- the front's and the back's against sheets 3 and 4's
    # idles, the right's and the left's against the turnaround's side views; one scale for the sheet, their median
    k6s = [k3 * body(c[6]['pf'][0][1])[0] / med(c[3]['idle']), k4 * body(c[6]['pb'][0][1])[0] / med(c[4]['idle']),
           kt * body(c[6]['pr'][0][1])[0] / turn2['right'], kt * body(c[6]['pl'][0][1])[0] / turn2['left']]
    k6 = float(np.median(k6s))
    print('  K6 (the Pounce) by front, back, right, left: %s -> %.2f' % (', '.join('%.2f' % k for k in k6s), k6))
    return {1: k1, 2: k2, 3: k3, 4: k4, 5: k5, 6: k6}


# which pages of ART-31 are cut in: the nine selected, and six of the nine review pages on Griz's word (10-15, "approve what you've done", of
# the seat's leans after he saw them play: dev/shots/harbinger-review/review.html). Not cut, asked again (ART-31 supplement 1): H2P1B, NE's
# Backhand (drawn straight from behind), H2P3A, NE's Mirror Strike (the art desk's BLOCKED arm swap), H2P3C, NE's Overfill (from behind);
# that supplement's three pages, H2P5-H2P7 (ART-31-NEROWS, back 10-15), in their place
USE31 = ('H1P1', 'H1P2', 'H1P3', 'H2P2', 'H2P4', 'H3P1', 'H3P2', 'H4P1', 'H5P1',
         'H2P1A', 'H2P1C', 'H2P3B', 'H5P2A', 'H5P2B', 'H5P2C',
         'H2P5', 'H2P6', 'H2P7')
# the engine's rows each ART-31 page gives a view: row -> {view: (page, the page's row)}; a view a page doesn't give (or not in USE31)
# plays what it played before ART-31 (S sheet 3's rows, N sheet 4's, the rest the side rows -- the head of this file)
V31 = {'idle': {'SE': ('H1P1', 'idle'), 'NE': ('H2P1A', 'idle')},
       'walk': {'SE': ('H1P1', 'walk'), 'NE': ('H2P1A', 'walk')},
       'drain': {'S': ('H3P1', 'drain'), 'SE': ('H1P1', 'drain'), 'NE': ('H2P1C', 'drain'), 'N': ('H5P1', 'drain')},
       'flinch': {'SE': ('H1P2', 'flinch'), 'NE': ('H2P2', 'flinch')},
       'hurt': {'S': ('H3P1', 'fall'), 'SE': ('H1P2', 'fall'), 'NE': ('H2P2', 'fall'), 'N': ('H5P1', 'fall')},
       'pounce': {'SE': ('H1P2', 'pounce'), 'NE': ('H2P2', 'pounce')},
       'foretell': {'S': ('H3P1', 'foretell'), 'SE': ('H1P2', 'foretell'), 'NE': ('H2P2', 'foretell'), 'N': ('H5P1', 'foretell')},
       'mirrorstrike': {'S': ('H3P1', 'mirrorstrike'), 'SE': ('H1P3', 'mirrorstrike'), 'NE': ('H2P6', 'mirrorstrike'), 'N': ('H5P1', 'mirrorstrike')},
       'kneel': {'S': ('H3P2', 'kneel'), 'SE': ('H1P3', 'kneel'), 'NE': ('H2P3B', 'kneel'), 'N': ('H5P2A', 'kneel')},
       'overfill': {'S': ('H3P2', 'overfill'), 'SE': ('H1P3', 'overfill'), 'NE': ('H2P7', 'overfill'), 'N': ('H5P2B', 'overfill')},
       'ascend': {'S': ('H3P2', 'ascend'), 'SE': ('H1P3', 'ascend'), 'NE': ('H2P4', 'ascend'), 'N': ('H5P2C', 'ascend')},
       'uprightidle': {'S': ('H3P2', 'uprightidle'), 'E': ('H4P1', 'uprightidle'), 'NE': ('H2P4', 'uprightidle'), 'N': ('H5P2C', 'uprightidle')}}
for _r in ('attack', 'backhand', 'backhand2'):
    V31[_r] = {'SE': ('H1P1', 'backhand'), 'NE': ('H2P5', 'backhand')}      # (backhand2 three-quarter: the same arm, as side-on)
V31['prone'], V31['cast'] = V31['hurt'], V31['kneel']
# the death and the Pounce stand on their first frame's feet (the hyena seat's way), not on the row's lowest pixel: H1P2 draws SE's lying
# body 31 page px (12 game px) lower than Fall 1's feet, toward the viewer, and its Pounce's dust 26 below, so by the lowest pixel SE's
# first frames stood in the air. Their rows are DROP px taller below the foot. (Prone, the same Fall's frames 4 and 5, keeps the lowest
# pixel: he stands up from it into the idle, on his own ground line.)
FLOOR31, DROP = ('hurt', 'pounce'), 8
VIEW = ['S', 'SE', 'E', 'NE', 'N', 'NE', 'E', 'SE']    # facing f's drawn view (S SW W NW N NE E SE; 1, 2, 3 play their view mirrored)
VIEW31 = lambda L: {'1': 'SE', '2': 'NE', '3': 'S', '4': 'E', '5': 'N'}[L[1]]
# each page's guard (the frames the art desk drew as his hunched guard or idle): (row, frame index, or None for the whole row)
GUARD31 = {'H1P1': [('idle', None)], 'H1P2': [('foretell', 0)],
           'H1P3': [('mirrorstrike', 5), ('kneel', 0), ('kneel', 7), ('overfill', 0), ('overfill', 5)],
           'H2P1A': [('idle', None)], 'H2P1B': [('backhand', 0), ('backhand', 5)], 'H2P1C': [('drain', 0), ('drain', 7)],
           'H2P2': [('foretell', 0)], 'H2P3A': [('mirrorstrike', 5)], 'H2P3B': [('kneel', 0), ('kneel', 7)],
           'H2P3C': [('overfill', 0), ('overfill', 5)], 'H2P4': [('ascend', 0)],
           'H2P5': [('backhand', 0), ('backhand', 5)], 'H2P6': [('mirrorstrike', 5)], 'H2P7': [('overfill', 0), ('overfill', 5)],
           'H3P1': [('drain', 0), ('drain', 7), ('foretell', 0), ('mirrorstrike', 5)],
           'H3P2': [('kneel', 0), ('kneel', 7), ('overfill', 0), ('overfill', 5)],
           'H5P1': [('drain', 0), ('drain', 7), ('foretell', 0), ('mirrorstrike', 5)],
           'H5P2A': [('kneel', 0), ('kneel', 7)], 'H5P2B': [('overfill', 0), ('overfill', 5)], 'H5P2C': [('ascend', 0)]}


def scales31(c, K, c31):
    """K per ART-31 page, and U, his upright height. GPT drew each page at its own size, the pages of one view not always alike
    (H3P2's guard stands 0.97 of H3P1's height at 1.06 its area). A page's guard (GUARD31) is met by AREA to the old side idle's (the
    old cutter met its sheets so, and an area keeps through a turn: the old turnaround's front, right and back measure alike); a page of
    S or N is also met by HEIGHT to the old sheet 3's or 4's idle, the same pose from the same side, and takes the geometric mean of
    the two. The upright rows are not: an erect body's height does not change as he turns, so every view's Upright Idle (and its
    Ascend's last frame) stands U, the median over the art desk's upright views of the height each has at the hunched guard's area
    (the old rows' rule: the upright the same mass as the hunch); Ascend's scale ramps from its page's to U's (main's frames_of)."""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    A = med(c[1]['idle']) / K[1]                                          # the old side idle's sqrt-area at game size
    HREF = {'S': med(c[3]['idle'], 1) / K[3], 'N': med(c[4]['idle'], 1) / K[4]}
    K31 = {}
    for L, rows in c31.items():
        if L not in GUARD31:
            continue
        g = [im for row, i in GUARD31[L] for k, (_, im, _) in enumerate(rows[row]) if i is None or k == i]
        ka = float(np.median([body(im)[0] for im in g])) / A
        v = VIEW31(L)
        K31[L] = float(np.sqrt(ka * float(np.median([body(im)[1] for im in g])) / HREF[v])) if v in HREF else ka
    ups = []
    for L, rows in c31.items():
        if L in K31 and ('uprightidle' in rows or 'ascend' in rows):
            frs = rows['uprightidle'] if 'uprightidle' in rows else rows['ascend'][-1:]
            ups.append(med(frs, 1) * A / med(frs))
    U = float(np.median(ups))
    print('  ART-31 K (page px a game px): %s; U, the upright height: %.1f px (from %s)' % (
        ', '.join('%s %.2f' % kv for kv in K31.items()), U, ', '.join('%.1f' % u for u in ups)))
    return K31, U


def hsv(img):
    a = np.asarray(img, dtype=np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return rgb, h, (mx - mn) / (mx + 1e-6), mx, a[..., 3] > 0.5


def classes31(h, s, v, on):
    """his fur (the ochre and its spots, the bronze plate) and his cloth (the crimson), each a mask; the mane, hands and outline left be"""
    return (on & (h >= 12) & (h < 50) & (s > 0.2) & (v > 0.2),
            on & ((h < 12) | (h > 335)) & (s > 0.45) & (v > 0.15))


def sv_means(imgs):
    acc = [[], []]
    for im in imgs:
        _, h, s, v, on = hsv(im)
        for k, m in enumerate(classes31(h, s, v, on)):
            acc[k].append(np.stack([s[m], v[m]], -1))
    return tuple(tuple(np.concatenate(x).mean(0)) for x in acc)


# his charcoal (the mane, the sooty hands and shins: dark, unsaturated, not the spots' brown) turned to one hue on every ART-31 page. The
# pages draw it 315-344 degrees, as the old sheets do (330-336); but cut down 2.4-4.3 times (sheet 1 1.7) its thin strands average with
# the ochre fur and snapped to the palette's brown, not the silver ramp deep16/js/ripple.js finds his mane by: from behind, H5P2B/C's
# Overfill, Ascend and Upright Idle had no mane at all (10-15). At 300 degrees they snap silver again, as the old sheets' did
CHAR_HUE = 300.0


def sv_toned(img, t):
    """the fur's and the cloth's saturation and value times t ((fur s, v), (cloth s, v)), at their own hue (the gnoll seat's way, 10-15:
    a per-channel gain moves the hue too); the charcoal turned to CHAR_HUE, its saturation and value kept"""
    rgb, h, s, v, on = hsv(img)
    al = np.asarray(img)[..., 3]
    char = on & (v >= 0.08) & (v < 0.42) & (s < 0.45) & ~((h >= 12) & (h < 50))
    for m, (fs, fv), hm in list(zip(classes31(h, s, v, on), t, (None, None))) + [(char, (1.0, 1.0), CHAR_HUE)]:
        s2, v2 = np.clip(s * fs, 0, 1), np.clip(v * fv, 0, 1)
        hh = ((h if hm is None else np.full_like(h, hm)) / 60) % 6; cc = v2 * s2; x = cc * (1 - np.abs(hh % 2 - 1)); z = np.zeros_like(cc)
        i = np.floor(hh).astype(int)
        out = np.select([(i == k)[..., None] for k in range(6)], [np.stack(q, -1) for q in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))])
        rgb = np.where(m[..., None], out + (v2 - cc)[..., None], rgb)
    return Image.fromarray(np.dstack([(np.clip(rgb, 0, 1) * 255).round().astype(np.uint8), al]), 'RGBA')


def tones31(c, c31):
    """each ART-31 page's fur and cloth brought to sheet 1's (the most-played rows) by saturation and value: the art desk drew him a
    little stronger and brighter than sheet 1"""
    ref = sv_means([im for row, frs in c[1].items() if row not in ('turn', 'portrait') for _, im, _ in frs])
    T = {}
    for L, rows in c31.items():
        got = sv_means([im for frs in rows.values() for _, im, _ in frs])
        T[L] = tuple((ref[k][0] / got[k][0], ref[k][1] / got[k][1]) for k in (0, 1))
    print('  ART-31 tone (fur s v, cloth s v) to sheet 1\'s fur %.2f %.2f, cloth %.2f %.2f: %s' % (ref[0] + ref[1] + (', '.join(
        '%s %.2f %.2f %.2f %.2f' % ((L,) + T[L][0] + T[L][1]) for L in T),)))
    return T


def build(check=False, use=USE31):
    """-> (frames, sizes): every engine row in its eight facings, from the old sheets and the ART-31 pages in `use`"""
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    c[1]['drain'] = drink_in(c[1]['drain'])
    c31 = {L: cut31(L, check) for L in ART31 if L in use}
    K31, U = scales31(c, K, c31)
    T31 = tones31(c, c31)
    small = {}
    def frames_of(L, row, first=False):
        """a row at game size: [(frame, its core's x, px above the row's floor)]; a row at one scale, but the upright rows at U (Upright
        Idle all at U, Ascend ramping from its sheet's or page's scale at frame 1 to U at its last); `first`: an ART-31 row's floor is its
        first frame's feet (FLOOR31)"""
        first = first and L in c31
        if (L, row, first) not in small:
            frs = c[L][row] if L in c else c31[L][row]
            k = K[L] if L in K else K31.get(L)
            if row == 'uprightidle':
                ks = [float(np.median([body(im)[1] for _, im, _ in frs])) / U] * len(frs)
            elif row == 'ascend':
                kn, n = body(frs[-1][1])[1] / U, len(frs)
                ks = [k * (kn / k) ** (i / (n - 1.0)) for i in range(n)]
            else:
                ks = [k] * len(frs)
            floor = frs[0][2][3] if first else max(b[3] for _, _, b in frs)
            out = []
            for (nm, im, box), kk in zip(frs, ks):
                if L in T31:
                    im = sv_toned(im, T31[L])
                a = game_frame(im, kk, TONE.get(L) if L in K else None)
                out.append((a, core_x(a), int(round((floor - box[3]) / kk))))
            small[(L, row, first)] = out
        return small[(L, row, first)]
    flip = lambda fs: [(a[:, ::-1], a.shape[1] - cx, up) for a, cx, up in fs]    # (the loop mirrors the west side: a row drawn facing west is flipped first)
    src, took, gaps = {}, {}, []
    for eng, (L, row) in ROWS.items():
        pick = (lambda fs: [fs[i] for i in PRONE]) if eng == 'prone' else (lambda fs: fs)
        side = pick(frames_of(L, row))
        per, names = [], []
        for f in range(8):
            v = VIEW[f]
            s31 = V31.get(eng, {}).get(v)
            if s31 and s31[0] in use:
                seq, nm = pick(frames_of(s31[0], s31[1], eng in FLOOR31)), s31[0]
            elif eng == 'pounce' and f in (0, 4):
                seq, nm = frames_of(6, 'pf' if f == 0 else 'pb'), 'pf' if f == 0 else 'pb'
            elif eng == 'pounce' and f in (1, 2, 3):                     # the left as drawn
                seq, nm = flip(frames_of(6, 'pl')), 'pl'
            elif eng == 'backhand2' and f == 0:
                seq, nm = flip(frames_of(3, 'backhand')), 's3m'
            elif eng == 'backhand2' and f == 4:
                seq, nm = frames_of(5, 'backhand'), 's5'
            elif f == 0 and L == 1 and row in FRONT:
                seq, nm = frames_of(3, row), 's3'
            elif f == 4 and L == 1 and row in BACK:
                seq, nm = frames_of(4, row), 's4'
            else:
                seq, nm = side, 'side'
            per.append(seq); names.append(nm + ('m' if f in (1, 2, 3) else ''))
            # a view of its own: an ART-31 page, the front and back sheets at S and N, the side at E (bar sheet 2's upright idle, drawn
            # three-quarter toward the viewer), and that upright idle at SE (the assignment's handoff keeps it there)
            own = (nm in ART31 or (v == 'S' and nm in ('pf', 's3', 's3m')) or (v == 'N' and nm in ('pb', 's4', 's5'))
                   or (v == 'E' and nm == 'side' and eng != 'uprightidle') or (v == 'SE' and nm == 'side' and eng == 'uprightidle'))
            if f in (0, 4, 5, 6, 7) and not own:
                gaps.append('%s %s' % (eng, v))
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng], took[eng] = per, names
    print('  facings (S SW W NW N NE E SE) <- (an ART-31 page; s3 s4 s5 sheets 3-5; pf pb pl the Pounce sheet\'s; side the side rows; m mirrored):')
    for eng, names in took.items():
        print('    %-12s %s' % (eng, ' '.join(names)))
    print('  five views: ' + ('every row in all five' if not gaps else '%d row-views still borrowed: %s' % (len(gaps), ', '.join(gaps))))
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH + (DROP if eng in FLOOR31 else 0), fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2, sizes[eng][1])
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    return frames, sizes


def main(check=False):
    frames, sizes = build(check)
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'mirrorgnoll_p1'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    s0 = frames['idle'][0][0]                       # (the panel's portrait centres on his face: his front idle's first opaque row, ten px down to the eyes -- ui.js, 10-08)
    meta['face'] = int(AY - np.where(s0[..., 3].any(axis=1))[0][0] - 10)
    meta['anims']['pounce']['release'] = IMPACT    # (frame 6 lands: the blow, the target's fall -- Griz, 10-08; ART-31's Pounce lands on its frame 6 too)
    meta['anims']['kneel']['same'] = 'cast'        # (one drawing, two names: the engine plays `cast` for his Kneel -- js/show.js wants it once)
    meta['source'] = ('generated by Griz (2026-10-08: two GPT sheets from the Astra draft -- the body and its fall, the mirror powers -- '
                      'then one from the front and one from behind) and the art desk (2026-10-15, ART-31: %s), cut by tools/mirrorgnoll-sheet.py'
                      % ', '.join(USE31))
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mirrorgnoll')
        lineup(frames, os.path.join(d, 'lineup.png'))
        facings(frames, sizes, d)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames, sizes, d):
    """the check: every facing of every row, S SW W NW N NE E SE top to bottom, the floor line under the frames (facings-<row>.png, 2x)"""
    from PIL import ImageDraw
    for row, per in frames.items():
        fw, fh = sizes[row][0], sizes[row][1]; n = len(per[0])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + AY), (cv.width, f * fh + AY)], fill=(110, 114, 110, 255))
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (fw + 4), f * fh))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))


def lineup(frames, path):
    """the house gnoll, the glory-seeker and him (E, S, N, upright), the troll, at 4x on a grey floor (his size, for Griz's eye)"""
    def first(name, anim, f):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        return im[y:y + an['fh'], 0:an['fw']], an['ax'], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('gloryseeker_p2', 'idle', 6), first('mirrorgnoll_p1', 'idle', 6),
            first('mirrorgnoll_p1', 'idle', 0), first('mirrorgnoll_p1', 'idle', 4), first('mirrorgnoll_p1', 'uprightidle', 6), first('troll_p1', 'idle', 6)]
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


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
