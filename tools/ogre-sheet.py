"""DEEP16 pipeline 2 (generated art): the art desk's ten GPT pages of the ogre (ART-06's four, ART-22's six) -> ogre_p2 (the Orc stand-in,
ogre_p1, stays on disk).

    python tools/ogre-sheet.py            (writes deep16/art/ogre_p2.png/.json)
    python tools/ogre-sheet.py check      (also the cut overlays, dev/visions/ogre/cut-<n>.png, a contact strip a row, every facing of every
                                           row, and a lineup beside the troll, the Orc stand-in, the hobgoblin and the ettin)

Sources (gitignored, the main checkout's -- a worktree reads them there), deep16/_src/ogre/, matched to the art desk's page IDs by the desk
(by eye and by hash; each page's view and rows confirmed by eye here, 10-14) -- the art log is deep16/_src/art-desk/ENGINE-ART-HANDOFF-
2026-10-14/ART-CUTTER-HANDOFF.md, "ART-06 -- Ogre -- 2026-10-10", its assignment assignments-and-manifests/ART-06-ogre.md:
  page 1  ART-06_HEAD-1_PAGE-1  OGRE-idle-walk-greatclub-firstsheet1.png      a portrait, a turnaround (Front, Right, Back, Left), Idle 6,
                                                                              Walk 8, Greatclub 6 (the version with Walk 4's club restored)
  page 2  ART-06_HEAD-1_PAGE-2  OGRE Javelin raised, ready to throw-3.png      Javelin 6, Flinch 4, Fall 6, Prone 2 (Javelin 3's spear restored)
  page 3  ART-06_HEAD-2_PAGE-1  Rear-view ogre animation sprite sheet-6.png   Idle 6, Walk 8, Greatclub 6, from behind
  page 4  ART-06_HEAD-2_PAGE-2  Rear ogre sprite sheet -1.png                  Javelin 6, Flinch 4, Fall 6, Prone 2, from behind (no javelin
                                                                              in flight)
and ART-22 (2026-10-14, the three views Griz's 10-14 ruling asks -- deep16/_src/ogre/ART-22/, by the names its manifest ART-22-MANIFEST.md
gives; each page's view and rows confirmed by eye here, 10-14):
  page 5  ART-22_HEAD-3_PAGE-1  ART-22_HEAD-3_PAGE-1.png    Idle 6, Walk 8, Greatclub 6 -- S, from the front
  page 6  ART-22_HEAD-3_PAGE-2  ART-22_HEAD-3_PAGE-2.png    Javelin 6, Flinch 4, Fall 6, Prone 2 -- S (no club in its Javelin: slung behind)
  page 7  ART-22_HEAD-4_PAGE-1  ART-22_HEAD-4_PAGE-1.png    Idle 6, Walk 8, Greatclub 6 -- E, the side, facing right
  page 8  ART-22_HEAD-4_PAGE-2  ART-22_HEAD-4_PAGE-2.png    Javelin 6, Flinch 4, Fall 6, Prone 2 -- E (the club on its back in the Javelin)
  page 9  ART-22_HEAD-5_PAGE-1  ART-22_HEAD-5_PAGE-1.png    Idle 6, Walk 8, Greatclub 6 -- N, from behind
  page 10 ART-22_HEAD-5_PAGE-2  ART-22_HEAD-5_PAGE-2.png    Javelin 6, Flinch 4, Fall 6, Prone 2 -- N (the club on its back in the Javelin)
Not read: superseded/ (the earlier versions of pages 1, 2 and 4), other-generator/ (the brown ogre's .jpg sheets -- Griz, 10-14: "there's
two ogre variants floating around... if one is missing pieces ignore for now") and ART-22's zip (the same six pages).
The pages are ISOMETRIC: HEAD 1 (pages 1, 2) is the ogre from the bottom-right, facing the bottom-right; HEAD 2 (pages 3, 4) from the
top-right, seen from behind, facing the top-right; HEAD 3 (pages 5, 6) from the front, facing the viewer; HEAD 4 (pages 7, 8) the right
side, facing right; HEAD 5 (pages 9, 10) from behind, facing away.

Rows (engine <- page row): `idle`, `walk`; `greatclub` and `attack` <- Greatclub (battle.js plays a row named for the attack, its Greatclub;
`attack` is the fallback); `javelin` <- Javelin, its `release` 3 (0-based: the javelin is held through human frame 3 and gone at 4, the arm
thrown forward -- battle.js times the throw by it, the bugbear's way); `flinch` <- Flinch (a blow that lands and doesn't drop it); `hurt` <-
Fall (it goes down, the club dropped); `prone` <- Prone, played pushing-up first so it lies at its last frame and gets up by playing it back
(deep16/js/sprites.js S.proneRow, the hobgoblin's and the ettin's way). Every row has the same frame count in every HEAD.
Facings (deep16/js/sprites.js S.FACINGS: 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE), RULED 10-14 (a figure is five drawn views): S <- HEAD 3,
E <- HEAD 4 and W <- HEAD 4 mirrored, N <- HEAD 5, SE <- HEAD 1 and SW <- HEAD 1 mirrored, NE <- HEAD 2 and NW <- HEAD 2 mirrored (the club
changes hands with the mirror, as every mirrored sheet's does). Till ART-22, S and E borrowed HEAD 1 and N HEAD 2; the SE, SW, NE and NW
frames are the same drawings, pixel for pixel and placed the same on the anchor, as before ART-22 came (only a row's frame width may grow).
Scale: one for the creature in every row and facing, by HEIGHT -- an upright figure. GPT drew each page at its own size (the art log: "Body
size differs across rows/pages"), so each page meets page 1's idle by its standing body: page 1 its idle (177-181 page px), page 2 its Flinch
1 and 4 (the idle's stance, club low: 172), page 3 its idle (201-204: the rear page drawn an eighth bigger), page 4 its Flinch 1 and 4
(171-175); page 5 its idle (203-204), page 7 its idle (225-235: the side page drawn an eighth bigger again), page 9 its idle (204-206); pages
6, 8 and 10 their Javelin 2 and 6 (the javelin drawn, standing, and the throw's recovery to rest: 192 195, 201 201, 186 190) -- ART-22's
Flinch CROUCHES (knees bent, the front view's the deepest: page 6's Flinch 177-179 against its Javelin 6's 195, where page 2's Flinch stands
0.95 of its Javelin 2), and met by it those pages came out a tenth too big against their own idle (the head and the shoulders, by eye,
each PAGE 2 laid beside its idle met both ways); by the Javelin the heads meet. The standing body is measured head to foot with the javelins on the back opened away
(OPEN: their count and their tips' height change row to row, an art issue). Within a page the standing rows agree with its rest within 2-3%
but three: pages 1, 5 and 7's Walk, drawn smaller (the head and the belly, by eye; FIT below). The game size: the standing body HEIGHT 80
px. The idle in every facing, game px with the outline, head to foot with the javelins opened away (body_h): S 81-83, SW 80-82, W 81-84, NW
81-83, N 81-83, NE 81-83, E 81-84, SE 80-82 (E's 84 its Idle 4, the hand on the head); with the javelins 84-92 (N's stand lowest over the
head, E's highest; top 91) -- the Orc stand-in's idle is drawn 80-94, the troll's (Large) 98-104 but lanky and stooped, the ettin's (Huge)
100-106 and broader; the hobgoblin's (Medium) 43-51. dev/visions/ogre/lineup.png stands them side by side; HEIGHT is the one number to change.
Colour: TONE brings pages 2-10 to page 1 per channel, by the skin (the yellow every view shows): page 2's Flinch 1 and 4 against page 1's
idle; page 3's idle against the turnaround's Back (the turnaround is drawn on page 1); page 4's Flinch 1 and 4 against page 3's idle; the S
pages (5, 6) against page 1's idle, the E pages (7, 8) against the turnaround's Right, the N pages (9, 10) against its Back. ART-22's gain is
weighed by how skin-like each pixel is (NEUTRAL): pages 6 and 10 draw the skin a third less blue than their idle pages and the hair and the
loincloth's tan not, and a plain gain (blue 1.4) turned the hair purple and the tan pink; pages 2-4 keep the plain gain they were cut with.
Cut: each row's band runs strip-middle to strip-middle, a page's last row to its foot; the Greatclub 4 impacts (pages 1, 3, 5, 7) and the
rear Fall 4's dust keep their chips and dirt (NUMBOX, FIX, CUT below); keyed by sheetrows' default test (the navy's blue-minus-red 63-78), looked
at on every frame: each gap of 40 px or more left inside a silhouette (an armpit, the raised arms' ring, under a lying body) is the navy in
shade (about 3 16 38, its blue-minus-red 20 or more at the 5th percentile), none of it the dark hair or outline.
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

FILES = {1: os.path.join('ogre', 'OGRE-idle-walk-greatclub-firstsheet1.png'),          # ART-06_HEAD-1_PAGE-1
         2: os.path.join('ogre', 'OGRE Javelin raised, ready to throw-3.png'),          # ART-06_HEAD-1_PAGE-2
         3: os.path.join('ogre', 'Rear-view ogre animation sprite sheet-6.png'),        # ART-06_HEAD-2_PAGE-1
         4: os.path.join('ogre', 'Rear ogre sprite sheet -1.png'),                      # ART-06_HEAD-2_PAGE-2
         5: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-3_PAGE-1.png'),                 # ART-22_HEAD-3_PAGE-1 (S)
         6: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-3_PAGE-2.png'),                 # ART-22_HEAD-3_PAGE-2 (S)
         7: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-4_PAGE-1.png'),                 # ART-22_HEAD-4_PAGE-1 (E)
         8: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-4_PAGE-2.png'),                 # ART-22_HEAD-4_PAGE-2 (E)
         9: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-5_PAGE-1.png'),                 # ART-22_HEAD-5_PAGE-1 (N)
         10: os.path.join('ogre', 'ART-22', 'ART-22_HEAD-5_PAGE-2.png')}                # ART-22_HEAD-5_PAGE-2 (N)
SRC = os.path.join(ROOT, 'deep16', '_src')                 # the sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the portrait, the row names; every row's number strip is added below), and its
# rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe -- a javelin's head is as white as a number)
SHEETS = {
  1: dict(text=[(0, 0, 425, 262), (0, 355, 140, 395), (0, 576, 140, 616), (0, 820, 150, 856)],
          rows=[('turn', (430, 0, 1460, 250), (250, 273), TURN, [574, 831, 1079, 1323]),
                ('idle', (0, 273, 1536, None), (481, 497), NUM(6), [246, 482, 697, 910, 1127, 1355]),
                ('walk', (0, None, 1536, None), (705, 721), NUM(8), [180, 360, 531, 712, 888, 1077, 1256, 1437]),
                ('greatclub', (0, None, 1536, None), (974, 989), NUM(6), [244, 485, 697, 917, 1160, 1389])]),
  2: dict(text=[(0, 122, 130, 161), (0, 370, 115, 409), (0, 611, 85, 649), (0, 833, 100, 872)],
          rows=[('javelin', (0, 0, 1536, None), (246, 264), NUM(6), [230, 478, 683, 910, 1129, 1377]),
                ('flinch', (0, None, 1536, None), (495, 512), NUM(4), [251, 523, 760, 986]),
                ('fall', (0, None, 1536, None), (719, 742), NUM(6), [206, 423, 637, 887, 1150, 1396]),
                ('prone', (0, None, 1536, None), (959, 978), NUM(2), [261, 566])]),
  3: dict(text=[(0, 146, 95, 185), (0, 433, 95, 473), (0, 753, 145, 790)],
          rows=[('idle', (0, 0, 1536, None), (280, 296), NUM(6), [205, 435, 656, 884, 1113, 1353]),
                ('walk', (0, None, 1536, None), (581, 597), NUM(8), [176, 346, 514, 686, 863, 1045, 1222, 1407]),
                ('greatclub', (0, None, 1536, None), (900, 917), NUM(6), [227, 471, 688, 906, 1155, 1394])]),
  4: dict(text=[(0, 146, 130, 185), (0, 403, 120, 442), (0, 645, 86, 687), (0, 870, 105, 909)],
          rows=[('javelin', (0, 0, 1536, None), (267, 285), NUM(6), [210, 439, 660, 897, 1147, 1384]),
                ('flinch', (0, None, 1536, None), (527, 545), NUM(4), [214, 488, 730, 1030]),
                ('fall', (0, None, 1536, None), (763, 781), NUM(6), [218, 453, 666, 881, 1141, 1384]),
                ('prone', (0, None, 1536, None), (965, 989), NUM(2), [218, 477])]),
  5: dict(text=[(0, 162, 110, 204), (0, 448, 108, 490), (0, 747, 160, 787)],
          rows=[('idle', (0, 0, 1536, None), (293, 311), NUM(6), [242, 468, 695, 903, 1121, 1338]),
                ('walk', (0, None, 1536, None), (582, 600), NUM(8), [191, 366, 539, 709, 880, 1064, 1239, 1423]),
                ('greatclub', (0, None, 1536, None), (910, 928), NUM(6), [243, 476, 695, 921, 1137, 1367])]),
  6: dict(text=[(0, 139, 150, 180), (0, 398, 132, 438), (0, 627, 100, 667), (0, 842, 112, 882)],
          rows=[('javelin', (0, 0, 1536, None), (256, 274), NUM(6), [220, 473, 702, 949, 1192, 1425]),
                ('flinch', (0, None, 1536, None), (513, 531), NUM(4), [270, 560, 840, 1132]),
                ('fall', (0, None, 1536, None), (747, 765), NUM(6), [221, 448, 667, 909, 1158, 1405]),
                ('prone', (0, None, 1536, None), (960, 980), NUM(2), [281, 642])]),
  7: dict(text=[(0, 151, 110, 192), (0, 460, 105, 501), (0, 769, 172, 809)],
          rows=[('idle', (0, 0, 1536, None), (295, 311), NUM(6), [229, 486, 732, 957, 1187, 1416]),
                ('walk', (0, None, 1536, None), (602, 619), NUM(8), [194, 376, 547, 711, 894, 1078, 1252, 1435]),
                ('greatclub', (0, None, 1536, None), (947, 965), NUM(6), [261, 489, 694, 905, 1152, 1384])]),
  8: dict(text=[(0, 126, 145, 166), (0, 382, 126, 421), (0, 615, 93, 654), (0, 854, 113, 893)],
          rows=[('javelin', (0, 0, 1536, None), (253, 269), NUM(6), [241, 468, 695, 912, 1144, 1376]),
                ('flinch', (0, None, 1536, None), (507, 523), NUM(4), [241, 508, 696, 914]),
                ('fall', (0, None, 1536, None), (737, 764), NUM(6), [230, 444, 672, 906, 1144, 1392]),
                ('prone', (0, None, 1536, None), (962, 979), NUM(2), [269, 640])]),
  9: dict(text=[(0, 162, 98, 202), (0, 477, 100, 517), (0, 788, 149, 826)],
          rows=[('idle', (0, 0, 1536, None), (296, 312), NUM(6), [198, 430, 653, 879, 1104, 1343]),
                ('walk', (0, None, 1536, None), (599, 615), NUM(8), [197, 382, 548, 720, 887, 1064, 1243, 1415]),
                ('greatclub', (0, None, 1536, None), (938, 955), NUM(6), [229, 470, 694, 916, 1157, 1375])]),
  10: dict(text=[(0, 131, 143, 171), (0, 380, 132, 420), (0, 623, 90, 661), (0, 852, 113, 891)],
           rows=[('javelin', (0, 0, 1536, None), (255, 272), NUM(6), [236, 456, 665, 900, 1132, 1380]),
                 ('flinch', (0, None, 1536, None), (503, 519), NUM(4), [273, 556, 827, 1104]),
                 ('fall', (0, None, 1536, None), (739, 757), NUM(6), [204, 433, 647, 863, 1119, 1380]),
                 ('prone', (0, None, 1536, None), (958, 975), NUM(2), [276, 615])]),
}
SPLIT = {(2, 'prone'): 745}   # (page, row) -> the line between it and the row above, by hand: page 2's Fall 6 drops its club's tip to 730,
                              # the strip's middle; the prone's javelin tips start at 778
# a row whose numbers are boxed one by one, not as a strip: the ground it struck lies between them (page 1's and page 3's Greatclub 4, the
# chips and the dirt round the club; page 4's Fall 4, its dust) -- a strip would drop every speck wholly inside it as lettering. A page's last
# row runs to the page's foot (nothing below it but its numbers)
NUMBOX = {(1, 'greatclub'), (3, 'greatclub'), (4, 'fall'), (5, 'greatclub'), (7, 'greatclub')}
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)] -- page 1's and page 3's
# Greatclub 4: the chips flying right of the club lie as near frame 5's foot as their own club
FIX = {1: {'greatclub': [((1030, 940, 1075, 990), '4')]},
       3: {'greatclub': [((1040, 815, 1078, 884), '4')]},
       5: {'greatclub': [((995, 795, 1052, 940), '4')]},
       7: {'greatclub': [((1030, 860, 1075, 950), '4')]}}
# a line of pixels cleared: page 3's Greatclub 4, a chip at x 1065-1069 y 876-881 touches frame 5's heel by one corner pixel
CUT = {3: {'greatclub': [((1069, 873), (1069, 883))]}}
TOUCH_OK = {}

# the drawn views: HEAD -> (its PAGE 1, its PAGE 2) -- every HEAD draws the same rows, PAGE 1 Idle, Walk, Greatclub; PAGE 2 Javelin, Flinch,
# Fall, Prone
HEADS = {1: (1, 2), 2: (3, 4), 3: (5, 6), 4: (7, 8), 5: (9, 10)}
# the engine's rows: engine name -> (the HEAD's PAGE 1 or 2, the page's row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'attack': (1, 'greatclub'), 'greatclub': (1, 'greatclub'),
        'javelin': (2, 'javelin'), 'flinch': (2, 'flinch'), 'hurt': (2, 'fall'), 'prone': (2, 'prone')}
REVERSED = {'prone'}                       # the pages draw it lying then pushing up: played backwards, it lies at its last frame
# per facing (deep16/js/sprites.js S.FACINGS): (HEAD, mirrored?) -- RULED 10-14, a figure is five drawn views: S <- HEAD 3, SW <- HEAD 1
# mirrored, W <- HEAD 4 mirrored, NW <- HEAD 2 mirrored, N <- HEAD 5, NE <- HEAD 2, E <- HEAD 4, SE <- HEAD 1
FACING = {0: (3, False), 1: (1, True), 2: (4, True), 3: (2, True), 4: (5, False), 5: (2, False), 6: (4, False), 7: (1, False)}
NEW = []              # rows not in pix.ANIM_ORDER (greatclub and javelin are there already: the stone giant's, the bugbears')
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'greatclub': 10, 'javelin': 10, 'flinch': 8, 'hurt': 8, 'prone': 8}
RELEASE = {'javelin': 3}                  # the frame the javelin is gone from the hand (human frame 4, the arm thrown forward): js/battle.js
# each page's standing body (row, frames 0-based): ART-22's PAGE 2s by their Javelin 2 and 6, standing at rest -- their Flinch crouches
REST = {1: [('idle', None)], 2: [('flinch', (0, 3))], 3: [('idle', None)], 4: [('flinch', (0, 3))],
        5: [('idle', None)], 6: [('javelin', (1, 5))], 7: [('idle', None)], 8: [('javelin', (1, 5))], 9: [('idle', None)],
        10: [('javelin', (1, 5))]}
# a row drawn at its own size on its page, met to the page's idle by height: page 1's Walk is drawn smaller than its idle (the head and the
# belly, by eye; its standing height 0.93 of the idle's, where the rear Walk on page 3 stands 0.98 of its idle) -- it meets page 1's idle
# keeping the rear walk's stride dip; so pages 5 and 7's (S 0.946, E 0.943 of their idles, the head and belly smaller by eye; N's on page 9
# stands 0.99, kept as drawn): (page, row) -> (page, row) whose ratio to its own idle is the one kept
FIT = {(1, 'walk'): (3, 'walk'), (5, 'walk'): (3, 'walk'), (7, 'walk'): (3, 'walk')}
# per channel, each later page brought to page 1 by the skin's mean (the yellow every view shows; a whole-figure mean weighs what each view
# shows -- the back is hair, hides and the javelins): page 2's Flinch 1 and 4 (228.2 147.3 53.3 -> page 1's idle 216.0 149.7 61.1); page 3's
# idle (214.5 146.9 51.1) to the turnaround's Back (200.7 140.6 53.4: the colours the art desk's later pages were asked to keep, as the
# ettin's back sheet met its turnaround's Back); page 4's Flinch 1 and 4 (218.8 140.3 41.9) to page 3's idle, toned. ART-22 (NEUTRAL: the
# gain weighed by how skin-like a pixel is -- its chroma CHROMA, its saturation SAT, its hue in the yellow-orange window HUE -- so the near-
# neutral hair, outline, spearheads and the loincloth's pale tan keep their drawn colour; found by rounds on the raw skin's pixels): page 5's
# idle (222.8 155.4 55.8) and page 6's Javelin 2 and 6 (225.9 142.8 43.9) to page 1's idle; page 7's idle (219.2 148.8 52.0) and page 8's
# Javelin 2 and 6 (217.4 149.1 55.7) to the turnaround's Right (207.6 144.3 55.3); page 9's idle (215.6 145.5 50.3) and page 10's Javelin 2
# and 6 (220.4 144.9 37.8) to the turnaround's Back -- tones() prints them
TONE = {2: (0.947, 1.016, 1.147), 3: (0.936, 0.957, 1.046), 4: (0.918, 1.002, 1.273),
        5: (0.972, 0.966, 1.107), 6: (0.958, 1.053, 1.412), 7: (0.949, 0.973, 1.075), 8: (0.957, 0.970, 0.996),
        9: (0.933, 0.969, 1.073), 10: (0.912, 0.973, 1.440)}
NEUTRAL = {5, 6, 7, 8, 9, 10}
CHROMA, SAT, HUE = (30, 90), (0.35, 0.6), (12, 22, 58, 70)     # ramps 0 -> 1 (the hue's back to 0 from 58 to 70 degrees)
HEIGHT = 80           # the standing body (head to foot, no javelins), game px before the outline: idle 87-90 px with the javelins and outline
OPEN = 10             # the radius (page px) of the opening that takes the javelins off the standing measure
FH, AY = 136, 124


def toned(im, f, neutral=False):
    """per channel, a gain; `neutral` (ART-22's pages, NEUTRAL) weighs it by how skin-like the pixel is: full on the skin's saturated
    yellow-orange, none on the near-neutral hair, outline and spearheads, the loincloth's pale tan or the club's red"""
    a = np.asarray(im).astype(float)
    g = np.array(f, dtype=float)
    if neutral:
        r, gr, b = a[..., 0], a[..., 1], a[..., 2]
        hi, lo = a[..., :3].max(-1), a[..., :3].min(-1)
        ch, sat = hi - lo, (hi - lo) / np.maximum(hi, 1)
        hue = np.where((r >= gr) & (gr >= b), 60 * (gr - b) / np.maximum(ch, 1), np.where((gr > r) & (r >= b), 120 - 60 * (r - b) / np.maximum(ch, 1), 0))
        ramp = lambda x, a0, a1: np.clip((x - a0) / (a1 - a0), 0, 1)
        w = (ramp(ch, *CHROMA) * ramp(sat, *SAT) * ramp(hue, *HUE[:2]) * (1 - ramp(hue, *HUE[2:])))[..., None]
        g = 1 + (g - 1) * w
    a[..., :3] = np.clip(a[..., :3] * g, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None, neutral=False):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone, neutral)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the belly and the chest; the arms, the club and the javelins are thinner), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


DISK = None
def standing(im):
    """a cut frame's standing height on the page: its lowest pixel to the top of the body with the thin things (the javelins' shafts and
    heads) opened away -- and its full height"""
    global DISK
    if DISK is None:
        yy, xx = np.mgrid[-OPEN:OPEN + 1, -OPEN:OPEN + 1]
        DISK = xx * xx + yy * yy <= OPEN * OPEN
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    o = ndimage.binary_opening(m, structure=DISK)
    ys, yo = np.where(m.any(1))[0], np.where(o.any(1))[0]
    return int(ys[-1] - yo[0] + 1), int(ys[-1] - ys[0] + 1)


def body_h(fr, r=5):
    """a game frame's standing height: its foot to the top of the body with the javelins (thinner than 2r+1 px with their outline) opened
    away -- the check that every facing stands the same height, measured again after the cut, the tone and the outline (r 4 leaves the
    front view's two javelins, side by side beside the head, standing 3 px over it)"""
    m = ndimage.binary_fill_holes(fr[..., 3] > 0)
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    o = ndimage.binary_opening(m, structure=xx * xx + yy * yy <= r * r)
    ys, yo = np.where(m.any(1))[0], np.where(o.any(1))[0]
    return int(ys[-1] - yo[0] + 1)


SKIN = lambda a:(a[..., 0] > 120) & (a[..., 1] > 85) & (a[..., 2] < 0.62 * a[..., 1]) & (a[..., 0] >= a[..., 1])
def skin_mean(ims):
    """mean RGB of the skin (bright yellow: red over green over a low blue) over cut frames"""
    px = []
    for im in ims:
        a = np.asarray(im).astype(float)
        sel = (a[..., 3] > 0) & SKIN(a)
        px.append(a[sel][:, :3])
    return np.concatenate(px).mean(0)


def skin_toned(ims, f, neutral=True):
    """mean RGB of the raw frames' skin pixels (the selection held: toning can carry a pixel out of SKIN's test), toned"""
    px = []
    for im in ims:
        a = np.asarray(im).astype(float)
        px.append(np.asarray(toned(im, f, neutral)).astype(float)[(a[..., 3] > 0) & SKIN(a)][:, :3])
    return np.concatenate(px).mean(0)


def figure_mean(ims):
    px = [np.asarray(im).astype(float)[np.asarray(im)[..., 3] > 0][:, :3] for im in ims]
    return np.concatenate(px).mean(0)


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


def bands(L):
    """each row's band: the middle of the strip above to the middle of its own (the first row's top as given, SPLIT where set; the last row
    to the page's foot)"""
    rows, prev = [], None
    for j, r in enumerate(SHEETS[L]['rows']):
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:                            # (the row above ends there too)
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2 if j < len(SHEETS[L]['rows']) - 1 else 1024
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def numbers(L, r):
    """a row's number strip as text boxes (a number's drop shadow runs past its strip): the whole strip, or each number's own (NUMBOX)"""
    if (L, r[0]) in NUMBOX:
        return [(int(x) - 14, r[2][0] - 3, int(x) + 14, r[2][1] + 4) for x in r[4]]
    return [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4)]


def cut(L, check=False):
    """sheetrows over one page"""
    s, rows = SHEETS[L], bands(L)
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [b for r in rows for b in numbers(L, r)],
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'ogre'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
        for r in rows:                                            # a frame whose box reaches its band's edge may have been clipped there
            for nm, im, box in out.get(r[0], ()):
                if r[0] != 'turn' and (box[1] + 2 <= r[1][1] + 1 or box[3] - 2 >= r[1][3] - 1 or box[0] + 2 <= 0 or box[2] - 2 >= 1535):
                    print('  near the band edge: page %d %s %s box %s band y %d-%d' % (L, r[0], nm, box, r[1][1], r[1][3]))
    return out


def rest_frames(c, L):
    return [im for row, sel in REST[L] for i, (_, im, _) in enumerate(c[L][row]) if sel is None or i in sel]


def scales(c):
    """K per page (page px a game px): each page's standing body against HEIGHT"""
    K = {}
    for L in SHEETS:
        hs = [standing(im) for im in rest_frames(c, L)]
        K[L] = float(np.median([h for h, _ in hs])) / HEIGHT
        print('  K: page %d %.3f -- its standing body %s page px (with the javelins %s)' % (L, K[L], [h for h, _ in hs], [f for _, f in hs]))
    med = lambda L, row: float(np.median([standing(im)[0] for _, im, _ in c[L][row]]))
    for L in SHEETS:                                              # every row's standing measure on its page, against the page's rest
        print('  page %d rows, median standing height at game size: %s' % (L, ', '.join(
            '%s %.1f' % (row, med(L, row) / K[L]) for row in c[L] if row != 'turn')))
    fit = {}
    for (L, row), (L2, row2) in FIT.items():
        fit[(L, row)] = (med(L, row) / med(L, 'idle')) / (med(L2, row2) / med(L2, 'idle'))
        print('  FIT: page %d %s %.3f (its standing %.3f of its idle; page %d %s %.3f of its idle, kept)'
              % (L, row, fit[(L, row)], med(L, row) / med(L, 'idle'), L2, row2, med(L2, row2) / med(L2, 'idle')))
    return K, fit


def tones(c):
    """per channel, each later page's skin brought to page 1's (the yellow every view shows)"""
    s1 = skin_mean([im for _, im, _ in c[1]['idle']])
    back = skin_mean([c[1]['turn'][2][1]])
    s2 = skin_mean(rest_frames(c, 2))
    s3 = skin_mean([im for _, im, _ in c[3]['idle']])
    s4 = skin_mean(rest_frames(c, 4))
    t = {2: s1 / s2, 3: back / s3}
    t[4] = t[3] * s3 / s4
    print('  skin: page 1 idle %s, its turnaround Back %s; page 2 flinch 1+4 %s; page 3 idle %s; page 4 flinch 1+4 %s'
          % tuple(np.round(x, 1).tolist() for x in (s1, back, s2, s3, s4)))
    # ART-22's views (NEUTRAL: the gain weighed by chroma, so found by a few rounds): S (pages 5, 6) to page 1's idle (its turnaround's
    # Front is the same three-quarter view), E (pages 7, 8) to the turnaround's Right (the side view), N (pages 9, 10) to the turnaround's
    # Back (as page 3) -- each PAGE 1 by its idle, each PAGE 2 by its rest (Javelin 2 and 6)
    front, right = skin_mean([c[1]['turn'][0][1]]), skin_mean([c[1]['turn'][1][1]])
    ims = {L: [im for _, im, _ in c[L]['idle']] if L % 2 else rest_frames(c, L) for L in (5, 6, 7, 8, 9, 10)}
    s = {L: skin_mean(ims[L]) for L in ims}
    goal = {5: s1, 6: s1, 7: right, 8: right, 9: back, 10: back}
    for L in ims:
        t[L] = goal[L] / s[L]
        for _ in range(6):
            t[L] = t[L] * goal[L] / skin_toned(ims[L], t[L])
    print('  skin: turnaround Front %s, Right %s; ' % tuple(np.round(x, 1).tolist() for x in (front, right)) + '; '.join(
        'page %d %s %s' % (L, 'idle' if L % 2 else 'javelin 2+6', np.round(s[L], 1).tolist()) for L in sorted(s)))
    print('  (a plain gain would be: page 5 %s (to the Front %s), page 6 %s; page 7 %s (to page 1 idle %s), page 8 %s; page 9 %s, page 10 %s)'
          % tuple(np.round(x, 3).tolist() for x in (s1 / s[5], front / s[5], s1 / s[6], right / s[7], s1 / s[7], right / s[8], back / s[9],
                                                   back / s[10])))
    print('  TONE measured: ' + ', '.join('%d: (%.3f, %.3f, %.3f)' % ((L,) + tuple(v)) for L, v in sorted(t.items())))
    tn = lambda L, im: toned(im, TONE[L], L in NEUTRAL) if L in TONE else im
    fm = lambda L, ims: np.round(figure_mean([tn(L, im) for im in ims]), 1).tolist()
    sm = lambda L, ims: np.round(skin_toned(ims, TONE[L], L in NEUTRAL), 1).tolist()
    def hair(L, ims):                                             # the near-neutral darks: the hair (and the outline's lighter edge)
        p = np.concatenate([np.asarray(tn(L, im)).astype(float)[np.asarray(im)[..., 3] > 0][:, :3] for im in ims])
        lum, ch = p @ np.array([0.3, 0.59, 0.11]), p.max(1) - p.min(1)
        return np.round(p[(lum > 20) & (lum < 70) & (ch < 45)].mean(0), 1).tolist()
    print('  hair (toned): ' + '; '.join('page %d %s' % (L, hair(L, x)) for L, x in (
        (1, [im for _, im, _ in c[1]['idle']]), (3, [im for _, im, _ in c[3]['idle']])) + tuple(sorted(ims.items()))))
    print('  figure means (toned): page 1 idle %s, page 2 flinch 1+4 %s; turnaround Back %s, page 3 idle %s, page 4 flinch 1+4 %s'
          % (fm(1, [im for _, im, _ in c[1]['idle']]), fm(2, rest_frames(c, 2)), fm(1, [c[1]['turn'][2][1]]),
             fm(3, [im for _, im, _ in c[3]['idle']]), fm(4, rest_frames(c, 4))))
    print('  ART-22 (toned): ' + '; '.join('page %d figure %s skin %s' % (L, fm(L, ims), sm(L, ims)) for L, ims in (
        (5, [im for _, im, _ in c[5]['idle']]), (6, rest_frames(c, 6)), (7, [im for _, im, _ in c[7]['idle']]), (8, rest_frames(c, 8)),
        (9, [im for _, im, _ in c[9]['idle']]), (10, rest_frames(c, 10)))))
    return t


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K, fit = scales(c)
    tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            k = K[L] * fit.get((L, row), 1.0)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, k, TONE.get(L), L in NEUTRAL)
                out.append((a, core_x(a), int(round((floor - box[3]) / k))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (pg, row) in ROWS.items():
        views = {}
        for h, pages in HEADS.items():
            fs = frames_of(pages[pg - 1], row)
            views[h] = fs[::-1] if eng in REVERSED else fs
        if len({len(v) for v in views.values()}) != 1:
            raise SystemExit('%s: frame counts differ by HEAD %s' % (eng, {h: len(v) for h, v in views.items()}))
        src[eng] = [(views[FACING[f][0]], FACING[f][1]) for f in range(8)]
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
    tall = max(AY - np.where(fr[..., 3].any(1))[0][0] for rows in frames.values() for row in rows for fr in row)
    print('  the tallest frame rises %d px over the foot (AY %d, FH %d)' % (tall, AY, FH))
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'ogre_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by the art desk (ART-06, 2026-10-10: HEAD 1 from the bottom-right, HEAD 2 from the top-right behind; ART-22, '
                      '2026-10-14: HEAD 3 the front, HEAD 4 the right side, HEAD 5 behind -- ten GPT pages, two a view), cut by tools/ogre-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    print('  idle opaque height with outline, by facing (S SW W NW N NE E SE): %s; top %d' % (
        ' '.join('%d-%d' % (min(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]), max(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]))
                 for f in range(8)), meta['top']))
    print('  idle body (head to foot, the javelins opened away at game size, with outline), by facing (S SW W NW N NE E SE): %s' % (
        ' '.join('%d-%d' % (min(body_h(fr) for fr in frames['idle'][f]), max(body_h(fr) for fr in frames['idle'][f])) for f in range(8))))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'ogre')
        lineup(os.path.join(d, 'lineup.png'))
        strips(frames, meta, d)


def art_frame(name, anim, facing, i):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(path):
    """the hobgoblin (Medium), the troll (Large), the Orc stand-in, the ogre (E, S, N, NE) and the ettin (Huge), at 4x on a grey floor, the
    foot on the red line (his size, for Griz's eye)"""
    figs = [art_frame('hobgoblin_p2', 'idle', 6, 0), art_frame('troll_p1', 'idle', 6, 0), art_frame('ogre_p1', 'idle', 6, 0),
            art_frame('ogre_p2', 'idle', 6, 0), art_frame('ogre_p2', 'idle', 0, 0), art_frame('ogre_p2', 'idle', 4, 0),
            art_frame('ogre_p2', 'idle', 5, 0), art_frame('ettin_p2', 'idle', 6, 0)]
    W = sum(a.shape[1] for a, _, _ in figs) + 10 * len(figs)
    top = max(ay for _, _, ay in figs); H = top + max(a.shape[0] - ay for a, _, ay in figs)
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    x = 5
    for a, ax, ay in figs:
        y0 = top - ay
        sub = canvas[y0:y0 + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[..., :3] = (a[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        canvas[top, x:x + a.shape[1], :3] = (200, 60, 60)
        x += a.shape[1] + 10
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


def strips(frames, meta, d, z=3):
    """a contact strip a row (the SE facing, a grey floor, the frame's number, the release frame ringed), and every facing of every row"""
    for eng, per in frames.items():
        fs = per[7]
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
    for eng in frames:                                            # every facing, S SW W NW N NE E SE top to bottom
        fw = meta['anims'][eng]['fw']
        n = len(frames[eng][0])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            for i, fr in enumerate(frames[eng][f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (fw + 4), f * FH))
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * FH + 2), ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'][f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % eng))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
