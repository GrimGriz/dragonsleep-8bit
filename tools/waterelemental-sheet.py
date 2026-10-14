"""DEEP16 pipeline 2 (generated art): the art desk's GPT pages of the water elemental (ART-08, ART-51) -> waterelemental_p2 (new: no stand-in).

    python tools/waterelemental-sheet.py            (writes deep16/art/waterelemental_p2.png/.json)
    python tools/waterelemental-sheet.py check      (also the cut overlays, dev/visions/waterelemental/cut-<n>.png, the key on the darkest
                                                     frame, a contact strip a row (row-<row>.png: the five drawn views), every facing of
                                                     every row (facings-<row>.png), and a lineup)

Sources (gitignored, the main checkout's -- a worktree reads them there), deep16/_src/waterelemental/, matched to the art desk's page IDs by
eye here (10-14: the desk could not tell the two second pages apart by name) -- the art log is deep16/_src/art-desk/ENGINE-ART-HANDOFF-
2026-10-14/ART-CUTTER-HANDOFF.md, "ART-08 -- Water elemental -- 2026-10-10", its assignment assignments-and-manifests/ART-08-water-elemental(2).md:
  page 1  ART-08_HEAD-1_PAGE-1  WATER ELMENTAL SHEET1.png                    a portrait, a turnaround (Front, Right, Back, Left), Idle 6, Move 8,
                                                                             Slam 6 -- from the bottom-right
  page 2  ART-08_HEAD-1_PAGE-2  Whelm’s final turquoise bubble poses.png    Whelm 8, Flinch 4, Fall 6 -- from the bottom-right (the face shows
                                                                             in every frame), Whelm 7 and 8 the swollen round holds (the log's
                                                                             "swollen Whelm7/8 repair")
  page 3  ART-08_HEAD-2_PAGE-1  Isometric water elemental sprite sheet.png   Idle 6, Move 8, Slam 6 -- from behind, the head in lost profile
                                                                             toward the top-right
Not cut: "Water elemental animation sprite sheet-2.png" -- the same page as page 2, the same drawings in the same places from the front
(re-rendered by the edit: 12-19 levels a channel on the figure, on average), but for Whelm 7 and 8, there the old holds, not swollen (66-81
levels): the version the repair superseded, not the rear page. ART-08_HEAD-2_PAGE-2 (Whelm, Flinch, Fall from behind) never came: ART-51
drew them. ART-51 (2026-10-14, the missing views; deep16/_src/waterelemental/ART-51/, its ART-51-MANIFEST.md and ART-51-waterelemental.md --
the files named by their page IDs, looked at here and each as the manifest says):
  page 4  ART-51_HEAD-2_PAGE-1  ART-51_HEAD-2_PAGE-1.png   Slam 6, Whelm 8, Flinch 4, Fall 6 -- from behind, facing the top-right; its Slam a
                                                           RE-ROLL that replaces page 3's (whose frame 4 burst upward off the shoulder: this
                                                           one smashes the ground ahead, the splash low and flat); page 3's Slam is still cut
                                                           (its band bounds the Move's) but plays nowhere
  page 5  ART-51_HEAD-3_PAGE-1  ART-51_HEAD-3_PAGE-1.png   Idle 6, Move 8, Slam 6 -- from the front, facing the viewer
  page 6  ART-51_HEAD-3_PAGE-2  ART-51_HEAD-3_PAGE-2.png   Whelm 8, Flinch 4, Fall 6 -- from the front
  page 7  ART-51_HEAD-4_PAGE-1  ART-51_HEAD-4_PAGE-1.png   Idle 6, Move 8, Slam 6 -- in profile from its right, facing the right edge
  page 8  ART-51_HEAD-4_PAGE-2  ART-51_HEAD-4_PAGE-2.png   Whelm 8, Flinch 4, Fall 6 -- in profile from its right
  page 9  ART-51_HEAD-5_PAGE-1  ART-51_HEAD-5_PAGE-1.png   Idle 6, Move 8, Slam 6 -- from behind, facing away (its right arm on the viewer's right)
  page 10 ART-51_HEAD-5_PAGE-2  ART-51_HEAD-5_PAGE-2.png   Whelm 8, Flinch 4, Fall 6 -- from behind
The pages are ISOMETRIC: HEAD 1 (pages 1, 2) is the elemental from the bottom-right, facing the bottom-right; HEAD 2 (pages 3, 4) from the
top-right, seen from behind, facing the top-right; HEAD 3 (5, 6) the front, HEAD 4 (7, 8) the right side, HEAD 5 (9, 10) the back.

Rows (engine <- page row): `idle`; `walk` <- Move; `slam`, `slam2` and `attack` <- Slam (battle.js plays a row named for the attack, its
second use in a turn `slam2` -- the SRD's Multiattack is two Slams -- and `attack` as the fallback), each its `release` 3 (0-based: human
frame 4, the arm down and the water thrown wide; battle.js strikes on it -- in all five views: ART-51's Slam 4 is the contact in each, the
arm down and the splash on the ground, 3 the arm at the top and 5 drawing back); `whelm` <- Whelm (it rears, crashes forward over a space
and closes round it, then holds swollen -- nothing drawn inside); `flinch` <- Flinch (a blow that lands and doesn't drop it); `hurt` <- Fall
(it collapses to a flat puddle, its last frame non-empty -- a flat pool on every page). No prone (SRD: immune). Every row has one frame count
in every facing.
Facings (deep16/js/sprites.js S.FACINGS: 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE) by the table FACING, a facing -> the views it takes in
order, (HEAD, mirrored?), the first that draws the row: RULED 10-14 a figure is five drawn views, and with ART-51 every row is drawn in all
five -- S <- HEAD 3, SW <- HEAD 1 mirrored, W <- HEAD 4 mirrored, NW <- HEAD 2 mirrored, N <- HEAD 5, NE <- HEAD 2, E <- HEAD 4, SE <- HEAD 1;
no fallbacks are left (till ART-51, S and E played HEAD 1, W HEAD 1 mirrored, and N/NE/NW HEAD 1's Whelm, Flinch and Fall). SE and SW are
the same drawings as before ART-51, NE and NW the same Idle and Move (their rows only wider: a frame's width is its row's, over every
facing). A view re-rolled or still to come is data only: its file in FILES, its rows in SHEETS, its rows under its HEAD in HEADS, its rest
in REST, its colour in TONE.
Scale: one for the creature, by HEIGHT -- an upright column: the resting body (the wave's foot to the crown, the bubbles, spray and the foam's
spikes opened away) stands HEIGHT px in every row and facing. GPT drew every row at its own size (the art log: "Resting body scale varies
across rows/pages; continuation sprites are larger"), so each row meets HEIGHT by its own resting frames: page 1's Idle (146-148 page px),
Slam 1 and 6 (162-165: the row drawn 11% over its idle); page 2's Whelm 1 (171), Flinch 1 and 4 (194, 175) and Fall 1 (210 -- each row of the
page at its own size: the heads and fists, and the widths, scale with the heights); page 3's Idle (190-194: the rear page drawn a third
bigger) and Slam 1 and 6 (196-199). The Move has no resting frame (it leans all through) and takes its page's idle: 0.94 of it on both
pages, the lean kept. ART-51's pages drift the same way (the manifest: "Resting scale varies across page/row layouts"), each row met the
same: page 4 (HEAD 2's own, drawn smaller than page 3) Slam 1 and 6 (181, 181), Whelm 1 (165), Flinch 1 and 4 (170, 167), Fall 1 (176); page 5
Idle (192-200), Slam 1 and 6 (195, 193); page 6 Whelm 1 (176), Flinch 1 and 4 (179, 182), Fall 1 (196); page 7 Idle (201-205), Slam 1 and 6
(195, 201); page 8 Whelm 1 (193), Flinch 1 and 4 (183, 183), Fall 1 (186); page 9 Idle (209-216), Slam 1 and 6 (205, 206); page 10 Whelm 1
(195), Flinch 1 and 4 (192, 192), Fall 1 (194). Their Moves meet WALK, the 0.94 the first two views' came out at (MOVE_MET: by its page's
idle HEAD 5's walk would stand 73 px against its idle's 84, drawn smaller, not leaning). What the rows mean is kept: the Whelm rears to 1.45
of its rest (Whelm 3) and holds swollen; the Fall spreads flat. The idle comes out with its bubbles and outline (S SW W NW N NE E SE)
87-93, 89-92, 86-90, 88-90, 85-87, 88-90, 86-90, 89-92 px tall (top 92) -- its resting body 84 in every one -- and 99-106 wide from the front,
97-104 SE, 84-89 in profile, 85-91 NE, 90-96 from behind; the walk rises 79-86 over its foot in every facing. Peers: the earth elemental (Large) top 94, the ogre (Large) 89, the
troll (Large) 75, the cube (Large) 72, the hobgoblin (Medium) 51 -- "twice a man's height". dev/visions/waterelemental/lineup.png stands them
side by side with the elemental in its five drawn views; HEIGHT is the one number to change.
Colour: TONE brings every later page to page 1's idle per channel, by the water's mean (it is water from every side: page 1's own
turnaround Front, Right and Back come out alike) -- ART-51's pages by their Idle or their Flinch 1 and 4; tones() prints them.
Cut: the key is this cutter's own (water_mask, see UP): sheetrows' tests either left the dark water of a shaded body as holes or took the
navy's shade. Each row's band runs strip-middle to strip-middle, a page's last row to its foot; page 1's Slam 4 splash and page 2's Fall
puddles keep their drops (NUMBOX), as do ART-51's Slam 4 splashes (pages 4, 5, 7), HEAD 3's Fall 6 pool (page 6) and a speck of page 5's
Slam 3 crest; detached spray, foam and bubbles go with their own frame (FIX, RELABEL, and split_whole for a drop the cut had halved -- ART-51
needed no FIX or RELABEL: its gutters, the HEAD 2 Whelm's tight eight too, cut clean). The foot: each frame by its wave (anchors) -- the
steadiest thing on these pages -- but for page 1's Slam 4 and 5 and pages 4 and 7's Slam 4 (by the body: the splash spreads the wave
along the ground ahead) and the SE and E Whelms (pages 2 and 8, by their numbers: it moves over its foe). A row's baseline is the median of
its frames' feet, so a Slam 4's splash lands under the foot (15 px SE, 8 NE, 7 S, 4 E), on the ground before it.
Still open (ART-51's manifest, looked at 10-14): HEAD 5's Slam 4 lands its arm and splash out to the screen-right of the body, not beyond its
head -- the N blow reads as a sideways strike toward E (NE's runs right along the ground too, but reads as its right-front); playback of the
loops, the Whelm hold and the impact timing in the game.
"""
import os, sys, json, subprocess
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

FILES = {1: os.path.join('waterelemental', 'WATER ELMENTAL SHEET1.png'),                          # ART-08_HEAD-1_PAGE-1
         2: os.path.join('waterelemental', 'Whelm’s final turquoise bubble poses.png'),      # ART-08_HEAD-1_PAGE-2 (a curly apostrophe)
         3: os.path.join('waterelemental', 'Isometric water elemental sprite sheet.png'),         # ART-08_HEAD-2_PAGE-1
         4: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-2_PAGE-1.png'),
         5: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-3_PAGE-1.png'),
         6: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-3_PAGE-2.png'),
         7: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-4_PAGE-1.png'),
         8: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-4_PAGE-2.png'),
         9: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-5_PAGE-1.png'),
         10: os.path.join('waterelemental', 'ART-51', 'ART-51_HEAD-5_PAGE-2.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # the sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the portrait, the row names; every row's number strip is added below), and its
# rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the page)
SHEETS = {
  1: dict(text=[(0, 0, 425, 366), (0, 455, 92, 485), (0, 652, 92, 681), (0, 864, 95, 893)],
          rows=[('turn', (430, 90, 1470, 312), (313, 342), TURN, [570, 841, 1111, 1369]),
                ('idle', (0, 345, 1536, None), (535, 557), NUM(6), [201, 412, 621, 830, 1039, 1249]),
                ('move', (0, None, 1536, None), (733, 755), NUM(8), [191, 364, 539, 713, 886, 1068, 1249, 1425]),
                ('slam', (0, None, 1536, None), (967, 990), NUM(6), [202, 432, 655, 919, 1162, 1403])]),
  2: dict(text=[(0, 225, 96, 255), (0, 526, 103, 557), (0, 805, 76, 850)],
          rows=[('whelm', (0, 0, 1536, None), (339, 364), NUM(8), [187, 359, 542, 743, 953, 1128, 1285, 1444]),
                ('flinch', (0, None, 1536, None), (631, 655), NUM(4), [211, 430, 653, 866]),
                ('fall', (0, None, 1536, None), (920, 947), NUM(6), [208, 446, 677, 911, 1153, 1390])]),
  3: dict(text=[(0, 213, 88, 243), (0, 488, 88, 517), (0, 806, 88, 835)],
          rows=[('idle', (0, 0, 1536, None), (306, 330), NUM(6), [197, 436, 670, 904, 1152, 1389]),
                ('move', (0, None, 1536, None), (590, 614), NUM(8), [172, 348, 523, 699, 877, 1059, 1244, 1425]),
                ('slam', (0, None, 1536, None), (919, 942), NUM(6), [185, 417, 645, 885, 1163, 1398])]),
  # ART-51 (2026-10-14): HEAD 2's own second page (1536 x 1024), then HEADs 3, 4 and 5 two pages each (1774 x 887)
  4: dict(text=[(0, 170, 96, 201), (0, 422, 104, 453), (0, 653, 108, 684), (0, 871, 86, 902)],
          rows=[('slam', (0, 0, 1536, None), (268, 296), NUM(6), [196.5, 434, 656.5, 919.5, 1185.5, 1407]),
                ('whelm', (0, None, 1536, None), (525, 550), NUM(8), [182.5, 352.5, 525.5, 713.5, 907, 1090.5, 1267, 1435.5]),
                ('flinch', (0, None, 1536, None), (755, 777), NUM(4), [216.5, 456.5, 685.5, 928.5]),
                ('fall', (0, None, 1536, None), (975, 997), NUM(6), [196, 412.5, 640.5, 875, 1129.5, 1385.5])]),
  5: dict(text=[(0, 178, 100, 212), (0, 445, 98, 479), (0, 714, 104, 746)],
          rows=[('idle', (0, 0, 1774, None), (284, 310), NUM(6), [220, 483.5, 752, 1022.5, 1292.5, 1563.5]),
                ('move', (0, None, 1774, None), (554, 578), NUM(8), [198.5, 404.5, 599.5, 801.5, 1011, 1218.5, 1423.5, 1626.5]),
                ('slam', (0, None, 1774, None), (833, 865), NUM(6), [220, 495, 752, 1022.5, 1325, 1582.5])]),
  6: dict(text=[(0, 179, 108, 213), (0, 443, 114, 477), (0, 701, 92, 736)],
          rows=[('whelm', (0, 0, 1774, None), (296, 324), NUM(8), [201, 405.5, 607, 825, 1052.5, 1251, 1454, 1660]),
                ('flinch', (0, None, 1774, None), (566, 594), NUM(4), [233.5, 492, 777.5, 1026.5]),
                ('fall', (0, None, 1774, None), (829, 856), NUM(6), [216, 464, 723.5, 1016, 1328, 1613.5])]),
  7: dict(text=[(0, 176, 100, 212), (0, 434, 100, 468), (0, 706, 100, 739)],
          rows=[('idle', (0, 0, 1774, None), (281, 307), NUM(6), [232.5, 485.5, 738, 999.5, 1257.5, 1526]),
                ('move', (0, None, 1774, None), (545, 570), NUM(8), [187, 382.5, 589, 794, 1005.5, 1212, 1426, 1630]),
                ('slam', (0, None, 1774, None), (825, 850), NUM(6), [219, 485, 750.5, 1036.5, 1345, 1590])]),
  8: dict(text=[(0, 224, 112, 256), (0, 476, 116, 508), (0, 714, 88, 746)],
          rows=[('whelm', (0, 0, 1774, None), (330, 355), NUM(8), [201.5, 386, 593, 811.5, 1055, 1267, 1461, 1660.5]),
                ('flinch', (0, None, 1774, None), (593, 617), NUM(4), [207.5, 479.5, 738.5, 963.5]),
                ('fall', (0, None, 1774, None), (836, 860), NUM(6), [201.5, 442, 705, 992, 1312.5, 1614.5])]),
  9: dict(text=[(0, 160, 100, 198), (0, 434, 102, 469), (0, 701, 100, 738)],
          rows=[('idle', (0, 0, 1774, None), (279, 307), NUM(6), [243.5, 509.5, 761.5, 1017.5, 1263.5, 1530.5]),
                ('move', (0, None, 1774, None), (542, 569), NUM(8), [208.5, 407.5, 605, 799, 1004.5, 1216.5, 1422.5, 1629.5]),
                ('slam', (0, None, 1774, None), (827, 854), NUM(6), [238.5, 509.5, 775, 1038.5, 1322.5, 1590])]),
  10: dict(text=[(0, 189, 114, 223), (0, 451, 114, 485), (0, 718, 84, 752)],
           rows=[('whelm', (0, 0, 1774, None), (301, 327), NUM(8), [225, 438.5, 642, 860, 1074.5, 1252, 1450.5, 1654.5]),
                 ('flinch', (0, None, 1774, None), (564, 588), NUM(4), [225, 546.5, 857, 1168.5]),
                 ('fall', (0, None, 1774, None), (825, 849), NUM(6), [225, 476.5, 741.5, 1008, 1302.5, 1608.5])]),
}
SPLIT = {}
# a row whose numbers are boxed one by one, not as a strip (a strip drops every speck wholly inside it as lettering): (page, row) -> the boxes
NUMBOX = {(1, 'slam'): [(188, 966, 216, 991), (418, 966, 446, 991), (641, 966, 669, 991), (905, 988, 933, 1011), (1148, 966, 1176, 991),
                        (1389, 966, 1417, 991)],
          (2, 'fall'): [(194, 919, 222, 948), (432, 919, 460, 948), (663, 919, 691, 948), (897, 919, 925, 948), (1139, 919, 1167, 948),
                        (1376, 919, 1404, 948)]}
# ART-51's, each number's own blob (x0 x1 y0 y1 off the page) 4 px round: the strip would take a speck of the row below's foam (page 5's
# Move, Slam 3's crest under its 3), Slam 4's splash drops (pages 4, 5, 7) and the edge of HEAD 3's Fall 6 pool (page 6) for lettering
_digits = lambda *bs: [(x0 - 4, y0 - 4, x1 + 4, y1 + 4) for x0, x1, y0, y1 in bs]
NUMBOX.update({
    (4, 'slam'): _digits((192, 201, 271, 288), (427, 441, 270, 289), (650, 663, 271, 289), (913, 926, 276, 294), (1179, 1192, 271, 289),
                         (1399, 1415, 270, 289)),
    (5, 'move'): _digits((192, 205, 557, 576), (397, 412, 556, 576), (592, 607, 557, 576), (794, 809, 557, 576), (1004, 1018, 557, 576),
                         (1211, 1226, 556, 576), (1417, 1430, 557, 576), (1619, 1634, 556, 576)),
    (5, 'slam'): _digits((213, 227, 835, 856), (488, 502, 836, 856), (745, 759, 836, 856), (1015, 1030, 843, 863), (1318, 1332, 836, 856),
                         (1575, 1590, 836, 856)),
    (6, 'fall'): _digits((209, 223, 834, 853), (457, 471, 834, 854), (716, 731, 834, 853), (1009, 1023, 834, 853), (1321, 1335, 834, 853),
                         (1606, 1621, 831, 852)),
    (7, 'slam'): _digits((211, 227, 828, 848), (477, 493, 827, 848), (743, 758, 828, 848), (1028, 1045, 827, 848), (1337, 1353, 828, 848),
                         (1582, 1598, 827, 848))})
# the foot's x by another thing than the wave (see anchors): page 1's Slam 4 and 5 by the body, their splash spread along the ground before
# them (by the wave they would slide 44 and 6 game px back); page 2's Whelm by its numbers -- it rears, crashes forward over its foe (4) and
# closes round it (5-8), its wave spreading and gathering under it (by the wave, 4 would slide back 10 game px and 6 forward 6)
# ART-51: the NE and E Slam 4 by the body too (their splash runs along the ground ahead: by the wave they would slide 9 and 16 game px
# back); the E Whelm by its numbers, as the SE's (it leans back on its wave, 3, and crashes forward over its foe, 4 and 5: by the wave the
# crash would stay put)
ANCHOR_FRAME = {(1, 'slam'): {3: 'core', 4: 'core'}, (4, 'slam'): {3: 'core'}, (7, 'slam'): {3: 'core'}}
ANCHOR = {(2, 'whelm'): 'label', (8, 'whelm'): 'label'}
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)] -- page 1's Slam 4: the drops
# its splash throws back up-left (their tails point at it) lie as near frame 3's fist
FIX = {1: {'slam': [((770, 835, 815, 900), '4')]}}
# every figure pixel in a box to one frame (see split_whole): page 3's Slam 4, the burst's tailed drops flung up-right -- the biggest is big
# enough to seed a frame of its own and lies nearer frame 5's number, so it grew into its own tail as frame 5's; nothing of frame 5 is in the box
RELABEL = {3: {'slam': [((1035, 660, 1120, 760), '4')]}}
CUT = {}
TOUCH_OK = {}
LOOSE = 1500          # a blob this small (page px) that the cut split between two frames goes whole to the frame holding most of it (see split_whole)
# the key (water_mask): a pixel is figure when one channel stands UP over the navy (the water, the foam, the dark blue of its shading), or it
# is the art's near-black outline (every channel under OUTLINE_MAX, its blue 25 under the navy's); a hole the figure closes round is filled
# when it is a pinhole or bluer than the navy (dark water in shade), and stays a hole when it is the navy or darker (a gap, in shade)
UP, OUTLINE_MAX = 14, 16

# the drawn views: HEAD -> {drawn row: (page, the page's row)}. A view re-rolled or still to come slots in here, its pages in FILES and
# SHEETS, its rest in REST, its colour in TONE: nothing else changes. ART-51 slotted in so: HEAD 2's Slam (re-rolled), Whelm, Flinch and Fall
# from page 4, and HEAD 3 (S, from the front), HEAD 4 (E, the right side) and HEAD 5 (N, from behind) whole
HEADS = {1: {'idle': (1, 'idle'), 'walk': (1, 'move'), 'slam': (1, 'slam'), 'whelm': (2, 'whelm'), 'flinch': (2, 'flinch'), 'hurt': (2, 'fall')},
         2: {'idle': (3, 'idle'), 'walk': (3, 'move'), 'slam': (4, 'slam'), 'whelm': (4, 'whelm'), 'flinch': (4, 'flinch'), 'hurt': (4, 'fall')},
         3: {'idle': (5, 'idle'), 'walk': (5, 'move'), 'slam': (5, 'slam'), 'whelm': (6, 'whelm'), 'flinch': (6, 'flinch'), 'hurt': (6, 'fall')},
         4: {'idle': (7, 'idle'), 'walk': (7, 'move'), 'slam': (7, 'slam'), 'whelm': (8, 'whelm'), 'flinch': (8, 'flinch'), 'hurt': (8, 'fall')},
         5: {'idle': (9, 'idle'), 'walk': (9, 'move'), 'slam': (9, 'slam'), 'whelm': (10, 'whelm'), 'flinch': (10, 'flinch'), 'hurt': (10, 'fall')}}
# per facing (deep16/js/sprites.js S.FACINGS: 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE): the views it takes, (HEAD, mirrored?), the first
# that draws the row playing it. RULED 10-14, five drawn views: S <- HEAD 3, E <- HEAD 4 (W mirrored), N <- HEAD 5, SE <- HEAD 1 (SW
# mirrored), NE <- HEAD 2 (NW mirrored). Every row is drawn in every view since ART-51, so each facing takes its own view alone (the
# fallbacks the 10-08 table needed till then -- S and E HEAD 1, W HEAD 1 mirrored, a row HEAD 2 did not draw HEAD 1's in N, NE and NW -- are
# gone); a view that lacks a row would name its stand-in after its own here
FACING = {0: ((3, False),), 1: ((1, True),), 2: ((4, True),), 3: ((2, True),), 4: ((5, False),), 5: ((2, False),), 6: ((4, False),),
          7: ((1, False),)}
# the engine's rows <- the drawn rows: battle.js plays a row named for the attack (Slam -> `slam`), its second use in a turn `slam2` (the
# SRD's Multiattack: two Slams), and `attack` as the fallback
ENGINE = {'idle': 'idle', 'walk': 'walk', 'attack': 'slam', 'slam': 'slam', 'slam2': 'slam', 'whelm': 'whelm', 'flinch': 'flinch',
          'hurt': 'hurt'}
NEW = ['slam', 'slam2', 'whelm']       # rows not in pix.ANIM_ORDER (the earth elemental's cutter appends slam and slam2 the same way)
FPS = {'idle': 6, 'walk': 8, 'attack': 10, 'slam': 10, 'slam2': 10, 'whelm': 8, 'flinch': 8, 'hurt': 8}
RELEASE = {'attack': 3, 'slam': 3, 'slam2': 3}     # the slam lands on human frame 4: battle.js strikes on a row's `release`
# the resting body each row is met by (its frames, 0-based): a row with a resting frame meets HEIGHT by it; a row with none (the Move, leaning
# all through) takes its page's (PAGE_REST)
REST = {(1, 'idle'): None, (1, 'slam'): (0, 5), (2, 'whelm'): (0,), (2, 'flinch'): (0, 3), (2, 'fall'): (0,), (3, 'idle'): None,
        (4, 'slam'): (0, 5), (4, 'whelm'): (0,), (4, 'flinch'): (0, 3), (4, 'fall'): (0,)}
for _L in (5, 7, 9):
    REST.update({(_L, 'idle'): None, (_L, 'slam'): (0, 5), (_L + 1, 'whelm'): (0,), (_L + 1, 'flinch'): (0, 3), (_L + 1, 'fall'): (0,)})
PAGE_REST = {1: 'idle', 2: 'flinch', 3: 'idle', 4: 'flinch', 5: 'idle', 6: 'flinch', 7: 'idle', 8: 'flinch', 9: 'idle', 10: 'flinch'}
# ART-51's Moves meet the walk ART-08's two set (their page's idle put both at 0.94 of HEIGHT, the lean): by its page's idle HEAD 5's would
# stand 0.87 (73 px) and 0.83 as wide -- drawn smaller than its idle, not leaning (from behind a lean does not narrow it) -- and HEAD 3's and
# HEAD 4's 0.92; each meets WALK by the median of its frames' bodies
WALK = 0.94
MOVE_MET = ((5, 'move'), (7, 'move'), (9, 'move'))
# per channel, each later page brought to page 1's idle by the water's mean (it is water from every side: page 1's own turnaround Front and
# Back come out alike, 71.7 152.6 182.9 and 72.5 151.8 183.5): page 2's Flinch 1 and 4 (79.5 164.7 197.9) and page 3's idle (74.5 162.1
# 190.1), both drawn lighter, to page 1's idle (77.5 157.2 185.3); ART-51's by their PAGE_REST row's resting frames -- HEAD 3's front page
# drawn lighter (80.1 168.8 194.9), the other six with less red (67.4-73.3) and a little more green and blue -- tones() prints them
TONE = {2: (0.974, 0.954, 0.936), 3: (1.039, 0.970, 0.974), 4: (1.149, 0.986, 0.978), 5: (0.967, 0.931, 0.950), 6: (1.057, 0.936, 0.940),
        7: (1.131, 0.987, 0.970), 8: (1.137, 0.977, 0.958), 9: (1.125, 0.985, 0.959), 10: (1.122, 0.971, 0.965)}
HEIGHT = 84           # the resting body (wave foot to crown, the spray and bubbles opened away), game px before the outline
OPEN = 8              # the radius (page px) of the opening that takes the bubbles and the foam's spikes off the resting measure
FH, AY = 148, 132     # the Whelm rears 130 px over the foot; Slam 4's splash lands 15 under it, on the ground before it


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the column of water; the arms, the spray and the bubbles are thinner)"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def base_x(a):
    """x of the wave it rolls on: the middle of the body's lowest 12 rows, the bubbles and the foam's spikes opened away"""
    o = ndimage.binary_opening(ndimage.binary_fill_holes(a[..., 3] > 0), structure=np.ones((9, 9)))
    ys = np.where(o.any(1))[0]
    xs = np.where(o[max(0, ys[-1] - 11):ys[-1] + 1].any(0))[0]
    return (xs[0] + xs[-1]) / 2.0


def anchors(L, row, frs):
    """each frame's x on the page that goes over the foot: its wave (base_x) -- against its number, the steadiest thing on these pages (page
    1's idle within 1 page px, where the thick middle the earlier cutters use wanders 11: the water's shapes churn). A frame whose wave is
    spread by the blow takes its thick middle (ANCHOR_FRAME), a row laid out by its numbers its number (ANCHOR), each moved by the row's
    median of (wave - that) over its other frames so the row does not jump"""
    labels = next(r[4] for r in SHEETS[L]['rows'] if r[0] == row)
    way = [ANCHOR_FRAME.get((L, row), {}).get(i, ANCHOR.get((L, row), 'base')) for i in range(len(frs))]
    base = [box[0] + base_x(np.asarray(im)) for _, im, box in frs]
    other = {'core': [box[0] + core_x(np.asarray(im)) for _, im, box in frs], 'label': labels}
    out = []
    for i, w in enumerate(way):
        if w == 'base':
            out.append(base[i])
        else:
            ref = [j for j in range(len(frs)) if way[j] == 'base'] or list(range(len(frs)))
            out.append(other[w][i] + float(np.median([base[j] - other[w][j] for j in ref])))
    return out


DISK = None
def body(im):
    """a cut frame's body on the page, the bubbles, the spray and the foam's spikes opened away: (height, width, the full height)"""
    global DISK
    if DISK is None:
        yy, xx = np.mgrid[-OPEN:OPEN + 1, -OPEN:OPEN + 1]
        DISK = xx * xx + yy * yy <= OPEN * OPEN
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    o = ndimage.binary_opening(m, structure=DISK)
    ys, yo, xo = np.where(m.any(1))[0], np.where(o.any(1))[0], np.where(o.any(0))[0]
    return int(yo[-1] - yo[0] + 1), int(xo[-1] - xo[0] + 1), int(ys[-1] - ys[0] + 1)


def figure_mean(ims):
    """mean RGB of the water (the art's near-black outline left out: how much of it a frame has is not its colour)"""
    px = [np.asarray(im).astype(float)[np.asarray(im)[..., 3] > 0][:, :3] for im in ims]
    px = np.concatenate(px)
    return px[px.max(-1) > 60].mean(0)


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
    foot = Image.open(os.path.join(SRC, FILES[L])).size[1]
    for j, r in enumerate(SHEETS[L]['rows']):
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2 if j < len(SHEETS[L]['rows']) - 1 else foot
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def numbers(L, r):
    """a row's number strip as text boxes: the whole strip, or each number's own (NUMBOX)"""
    if (L, r[0]) in NUMBOX:
        return NUMBOX[(L, r[0])]
    return [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4)]


def water_mask(a, grey=None, far=None, chan=None):
    """the key for these pages, in place of sheetrows' figure_mask (see UP above): the navy's own variation runs 9 over it at most and the rest
    under it (a vignette, the shade round the figure), so nothing of the navy is taken; sheetrows' `chan` (any channel 28 from the navy, either
    way) left the dark water of a shaded body as holes and took the shade in its gaps"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    m = ((a - navy).max(-1) > UP) | ((a.max(-1) < OUTLINE_MAX) & (a[..., 2] < navy[2] - 25))
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        idx = np.arange(1, n + 1)
        sz = np.asarray(ndimage.sum(holes, lab, idx))
        blue = np.asarray(ndimage.median(a[..., 2], lab, idx))
        m |= np.isin(lab, idx[(sz < 12) | (blue > navy[2] + 3)])
    return m


def split_whole(orig, relabel):
    """sheetrows' split_band, then RELABEL's boxes (`relabel`: the row's label xs -> [(box, frame index)]), then every small blob it split
    between two frames given whole to the one holding most of it: sheetrows gives a loose bit's pixels each to its nearest frame, so a drop or
    a bubble between two frames came out halved (the bubbles round the Whelm and Flinch rows, the Slam 4 spray -- five such on the three pages)"""
    def split(m, xs):
        g = orig(m, xs)
        for (x0, y0, x1, y1), k in relabel.get(tuple(int(x) for x in xs), ()):
            sub = g[y0:y1, x0:x1]; sub[sub > 0] = k + 1
        lab, _ = ndimage.label(m, structure=np.ones((3, 3)))
        for i, sl in enumerate(ndimage.find_objects(lab)):
            piece = lab[sl] == i + 1
            if piece.sum() > LOOSE:
                continue
            ids, cnt = np.unique(g[sl][piece], return_counts=True)
            if len(ids) > 1:
                sub = g[sl]; sub[piece & (sub > 0)] = ids[np.argmax(cnt)]
        return g
    return split


def cut(L, check=False):
    """sheetrows over one page"""
    s, rows = SHEETS[L], bands(L)
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig, orig_split, orig_mask = SR.label_xs, SR.split_band, SR.figure_mask
    spec = dict(text=s['text'] + [b for r in rows for b in numbers(L, r)],
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    SR.split_band = split_whole(orig_split, {tuple(int(x) for x in r[4]): [(b, r[3].index(nm)) for b, nm in RELABEL.get(L, {}).get(r[0], ())]
                                             for r in rows})
    SR.figure_mask = water_mask
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs, SR.split_band, SR.figure_mask = orig, orig_split, orig_mask
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'waterelemental'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
        for r in rows:                                            # a frame whose box reaches its band's edge may have been clipped there
            for nm, im, box in out.get(r[0], ()):
                if r[0] != 'turn' and (box[1] + 2 <= r[1][1] + 1 or box[3] - 2 >= r[1][3] - 1 or box[0] + 2 <= 0 or box[2] - 2 >= r[1][2] - 1):
                    print('  near the band edge: page %d %s %s box %s band y %d-%d' % (L, r[0], nm, box, r[1][1], r[1][3]))
    return out


def rest_frames(c, L, row):
    sel = REST[(L, row)]
    return [im for i, (_, im, _) in enumerate(c[L][row]) if sel is None or i in sel]


def scales(c):
    """K per (page, row) (page px a game px): each row's resting body against HEIGHT, or its page's"""
    K = {}
    for (L, row) in REST:
        hs = [body(im) for im in rest_frames(c, L, row)]
        K[(L, row)] = float(np.median([h for h, _, _ in hs])) / HEIGHT
        print('  K: page %d %s %.3f -- its resting body %s page px tall, %s wide (with the bubbles %s tall)'
              % (L, row, K[(L, row)], [h for h, _, _ in hs], [w for _, w, _ in hs], [f for _, _, f in hs]))
    for (L, row) in MOVE_MET:
        hs = [body(im)[0] for _, im, _ in c[L][row]]
        K[(L, row)] = float(np.median(hs)) / (WALK * HEIGHT)
        print('  K: page %d %s %.3f -- its bodies %s page px tall (median %.0f) to %.1f; by its page\'s idle it would be %.1f'
              % (L, row, K[(L, row)], hs, np.median(hs), WALK * HEIGHT, np.median(hs) / K[(L, PAGE_REST[L])]))
    for L in SHEETS:
        for row in c[L]:
            if row != 'turn' and (L, row) not in K:
                K[(L, row)] = K[(L, PAGE_REST[L])]
    for L in SHEETS:                                              # every row's body at game size
        print('  page %d rows, median body height x width at game size (by its own K; by the page\'s): %s' % (L, ', '.join(
            '%s %.1f x %.1f; %.1f' % (row, np.median([body(im)[0] for _, im, _ in c[L][row]]) / K[(L, row)],
                                      np.median([body(im)[1] for _, im, _ in c[L][row]]) / K[(L, row)],
                                      np.median([body(im)[0] for _, im, _ in c[L][row]]) / K[(L, PAGE_REST[L])]) for row in c[L] if row != 'turn')))
    return K


def tones(c):
    """per channel, each page's mean against page 1's"""
    m1 = figure_mean([im for _, im, _ in c[1]['idle']])
    back = figure_mean([c[1]['turn'][2][1]])
    front = figure_mean([c[1]['turn'][0][1]])
    right = figure_mean([c[1]['turn'][1][1]])
    print('  figure means: page 1 idle %s, its turnaround Front %s, Right %s, Back %s' % tuple(np.round(x, 1).tolist() for x in (m1, front, right, back)))
    for L in sorted(SHEETS):
        if L > 1:
            mL = figure_mean(rest_frames(c, L, PAGE_REST[L]))
            print('  page %d %s (its resting frames) %s: to page 1 idle %s, TONE %s'
                  % (L, PAGE_REST[L], np.round(mL, 1).tolist(), np.round(m1 / mL, 3).tolist(), TONE.get(L)))


def view_rows(head):
    return HEADS.get(head, {})


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = float(np.median([b[3] for _, _, b in frs]))      # the row's baseline: a frame drawn lower (Slam 4's splash on the
            k = K[(L, row)]                                          # ground before it, the spreading Fall) goes below the foot
            out = []
            for (nm, im, box), ax_page in zip(frs, anchors(L, row, frs)):
                a = game_frame(im, k, TONE.get(L))
                out.append((a, (ax_page - box[0]) * a.shape[1] / im.size[0], int(round((floor - box[3]) / k))))
            small[(L, row)] = out
        return small[(L, row)]
    src, took = {}, {}
    for eng, drawn in ENGINE.items():
        per = []
        for f in range(8):
            head, mirrored = next((h, mi) for h, mi in FACING[f] if drawn in view_rows(h))
            per.append((frames_of(*view_rows(head)[drawn]), mirrored))
            took.setdefault(eng, []).append('%d%s' % (head, 'm' if mirrored else ''))
        n = {len(fs) for fs, _ in per}
        if len(n) != 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, n))
        src[eng] = per
    print('  facings (S SW W NW N NE E SE) <- HEAD (m mirrored): ' + '; '.join('%s %s' % (e, ' '.join(t)) for e, t in took.items()))
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
        raise SystemExit('cut off at the frame edges: ' + ', '.join(sorted(set(lost))))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'waterelemental_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by the art desk (ART-08, 2026-10-10: GPT pages -- HEAD 1 from the bottom-right, two pages; HEAD 2 from the '
                      'top-right behind, its first page; ART-51, 2026-10-14: HEAD 2 its Slam re-rolled with its Whelm, Flinch and Fall, '
                      'HEAD 3 from the front, HEAD 4 the right side, HEAD 5 from behind, two pages each), cut by tools/waterelemental-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    w = lambda fr: np.where(fr[..., 3].any(axis=0))[0]
    print('  idle opaque height x width with outline, by facing (S SW W NW N NE E SE): %s; top %d' % (
        ' '.join('%d-%dx%d-%d' % (min(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]), max(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]),
                                  min(w(fr)[-1] - w(fr)[0] + 1 for fr in frames['idle'][f]), max(w(fr)[-1] - w(fr)[0] + 1 for fr in frames['idle'][f]))
                 for f in range(8)), meta['top']))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'waterelemental')
        lineup(os.path.join(d, 'lineup.png'))
        strips(frames, meta, d)
        darkest(c, d)


def art_frame(name, anim, facing, i):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(path):
    """the hobgoblin (Medium); the troll, the ogre, the cube and the earth elemental (Large); the water elemental in its five drawn views (S,
    SE, E, NE, N); the ettin (Huge) -- at 4x on a grey floor, the foot on the red line (its size, for Griz's eye)"""
    figs = [art_frame('hobgoblin_p2', 'idle', 6, 0), art_frame('troll_p1', 'idle', 6, 0), art_frame('ogre_p2', 'idle', 6, 0),
            art_frame('cube_p2', 'idle', 6, 0), art_frame('earthelemental_p2', 'idle', 6, 0)]
    figs += [art_frame('waterelemental_p2', 'idle', f, 0) for f in (0, 7, 6, 5, 4)] + [art_frame('ettin_p2', 'idle', 6, 0)]
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
    """a contact strip a row (the five drawn views top to bottom -- S, SE, E, NE, N -- a grey floor, the frame's number, the release frame
    ringed), and every facing of every row"""
    for eng, per in frames.items():
        fw = meta['anims'][eng]['fw']
        n = len(per[0])
        W, H = fw * n + 4 * (n + 1), FH * 5
        cv = Image.new('RGBA', (W, H), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for j, f in enumerate((0, 7, 6, 5, 4)):
            for i, fr in enumerate(per[f]):
                x = 4 + i * (fw + 4)
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (x, j * FH))
                dr.line([(x, j * FH + AY + 1), (x + fw, j * FH + AY + 1)], fill=(110, 114, 110, 255))
                dr.text((x + 2, j * FH + 2), str(i + 1), fill=(255, 255, 255, 255))
                if meta['anims'][eng].get('release') == i:
                    dr.rectangle([x, j * FH, x + fw - 1, j * FH + FH - 1], outline=(255, 90, 90, 255))
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


def darkest(c, d, z=3):
    """the key proved on the darkest frame: the cut frame (by its mean light) at z x beside its page crop with the cut's edge drawn in red"""
    best = None
    for L in c:
        for row, frs in c[L].items():
            if row == 'turn':
                continue
            for nm, im, box in frs:
                a = np.asarray(im).astype(float)
                lum = a[a[..., 3] > 0][:, :3].mean()
                if best is None or lum < best[0]:
                    best = (lum, L, row, nm, im, box)
    lum, L, row, nm, im, box = best
    print('  the darkest frame: page %d %s %s (mean %.1f)' % (L, row, nm, lum))
    page = Image.open(os.path.join(SRC, FILES[L])).convert('RGB').crop(box)
    al = np.asarray(im)[..., 3] > 0
    edge = al & ~ndimage.binary_erosion(al)
    pa = np.asarray(page).copy(); pa[edge] = (255, 40, 40)
    w, h = page.size
    cv = Image.new('RGB', (w * 2 + 8, h), (70, 74, 70))
    cv.paste(Image.fromarray(pa), (0, 0))
    cv.paste(Image.alpha_composite(Image.new('RGBA', im.size, (70, 74, 70, 255)), im).convert('RGB'), (w + 8, 0))
    cv.resize((cv.width * z, cv.height * z), Image.NEAREST).save(os.path.join(d, 'key-darkest.png'))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
