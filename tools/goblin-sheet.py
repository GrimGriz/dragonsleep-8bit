"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets for the goblin -> one palette sprite sheet, goblin_p2.

    python tools/goblin-sheet.py            (writes deep16/art/goblin_p2.png/.json)
    python tools/goblin-sheet.py check      (also the cut overlays, dev/visions/goblin/cut-<n>.png, every facing of every row,
                                             facings-<row>.png, and the idle in all eight facings beside its peers, lineup.png)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Goblin-GPT1.png .. Goblin-GPT4.png -- Griz, 2026-10-07,
from the four pastes in deep16-art-in-hand.md "The goblin, redone" (his: "Redoing goblins while we have an expanded art department, please the
copypasta for all the 16 bit sprite animation rows we'll need for them", then "Should be GPT Goblins in _src"). Sheet 1 the side rows (idle, walk,
scimitar, shortbow, flinch, fall, prone; its portrait and turnaround not used), sheet 2 its tricks side-on (nimble escape, hide, climb), sheet 3
from the front, sheet 4 from behind. Each is cut by its own row and number labels (tools/sheetrows.py; the boxes below were read off the sheets
by their white labels).

The rows face RIGHT: facings NE, E and SE take them as drawn, SW, W and NW mirrored; S takes sheet 3's rows, N sheet 4's (the fall, prone and
hide stay side-on, and the climb has no front -- the paste's calls). Each sheet takes its own scale (K: the body's radius, holes filled, the
median over the rows that stand -- heights lie: the side views hunch), every frame snapped to deep16/palette.json and outlined, then set on the
frame by its body's middle, at the height the sheet drew it off its row's floor. The goblin is Small: about 36 px at its hunched side idle
(the Blob Orc it replaces stood 37-39; a dwarf 37-42, a man about 50). The seat's calls: sheet 4's idle has five frames to the others' six, so
from behind it plays 1 2 3 4 5 4 (a row has one frame count in every facing); the swing arcs and the motion lines stay with their frames; the
nimble hop's lines are dropped (they sat on the floor and would pin the hop to it).

The diagonals and the front and back of the fall, prone and hide (2026-10-14): RULED 10-14, a figure is five drawn views -- SE (SW mirrored),
NE (NW mirrored), S, E (W mirrored), N. The art desk drew the views the four sheets lack as ART-24 (deep16/_src/goblin/ART-24/, its
ART-24-MANIFEST.md; "Human numbers 1-based, engine indices 0-based"), from the bottom-right (HEAD 1, facing SE), the top-right from behind
(HEAD 2, facing NE), the front (HEAD 3) and behind (HEAD 5):
  H1P1  ART-24_HEAD-1_PAGE-1.png  SE: Idle 6, Walk 8, Scimitar 6, Shortbow 6
  H1P2  ART-24_HEAD-1_PAGE-2.png  SE: Flinch 4, Fall 6, Prone 2, Nimble Escape 4, Hide 4
  H2P1  ART-24_HEAD-2_PAGE-1.png  NE: the rows of H1P1
  H2P2  ART-24_HEAD-2_PAGE-2.png  NE: the rows of H1P2
  H3P1  ART-24_HEAD-3_PAGE-1.png  S:  Fall 6, Prone 2, Hide 4
  H5P1  ART-24_HEAD-5_PAGE-1.png  N:  Fall 6, Prone 2, Hide 4
A facing takes the first view in FACING that draws the row: S the front (sheet 3), then HEAD 3; SW HEAD 1 mirrored; W the side mirrored; NW
HEAD 2 mirrored; N the back (sheet 4), then HEAD 5; NE HEAD 2; E the side; SE HEAD 1 -- and the climb, which ART-24 does not draw, as it was
(the side in every facing but N; SW, W and NW mirrored). The S, N, E and W frames of the rows sheets 1-4 drew are the same drawings as before.
Every ART-24 row has the side row's frame count (idle 6, walk 8, scimitar 6, shortbow 6, flinch 4, fall 6, prone 2, nimble 4, hide 4); its
shortbow looses on frame 5 as the side's does (RELEASE: frame 4 the arrow at full draw, frame 5 gone). ART-24's pages are not drawn to one
scale (its manifest says so), so each page is measured (K, sheet px a game px): the old sheets' measure -- the figure's sqrt(area), holes
filled -- with its height beside it, since the two part on a slim view, and K the geometric mean of the two. SE's idle meets the mean of the
S and E idles as committed (game px with the outline: area 37.6 and 34.7, height 43 and 38) -- by area 3.74, by height 3.80, K 3.77; NE's
the mean of the N and E (area 39.0 and 34.7, height 44 and 38) -- by area 3.35, by height 3.70, K 3.52 (by area alone the NE idle stood 45,
over N and E both); each page 2 by its standing frames (flinch 1 and 4, fall 1) against its page 1's idle, by area (HEAD 1 0.945, HEAD 2
1.02); HEAD 3 by its Hide 1 (the guard, the front idle's pose) against the S idle (by area 4.47, by height 4.30, K 4.38), HEAD 5 by its Hide
1 against the N idle (by area 4.00, by height 3.70, K 3.85). One row GPT drew bigger than its page: HEAD 2's Shortbow (KROW). The idle then
stands, by facing (S SW W NW N NE E SE, median px with the outline): 43 40.5 38 43 44 43 38 40.5. Colour: each page toned to sheet 1's as
the others are (TONE; HEAD 2's first page drew the skin a warmer yellow, red over green, so its skin test leans 15). The fall of the ART-24
views is set on the frame by its first frame's feet (FLOOR: it stands where the idle stood; the body lying lower on the page, toward the
camera, lies below the foot); HEAD 5's Fall 1 has a grey dash under its foot dropped (a stray mark).
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

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'Goblin-GPT1.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
# per sheet: text boxes (a blob wholly inside one is lettering, or a mark dropped on purpose), and the rows:
# (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order)
SHEETS = {
    1: dict(file='Goblin-GPT1.png',
            text=[(0, 225, 185, 265), (0, 340, 185, 385), (0, 465, 185, 505), (0, 585, 185, 635), (0, 705, 185, 760), (0, 825, 185, 865),
                  (0, 930, 185, 970)],
            rows=[('idle', (185, 200, 1491, 302), (303, 321), NUM(6)),
                  ('walk', (185, 322, 1491, 418), (419, 437), NUM(8)),
                  ('scimitar', (185, 438, 1491, 549), (550, 568), NUM(6)),
                  ('shortbow', (185, 569, 1491, 680), (681, 700), NUM(6)),
                  ('flinch', (185, 701, 1491, 789), (790, 811), NUM(4)),
                  ('fall', (185, 812, 1491, 895), (896, 914), NUM(6)),
                  ('prone', (185, 915, 1491, 994), (995, 1014), NUM(2))]),
    2: dict(file='Goblin-GPT2.png',
            text=[(0, 140, 322, 220), (0, 440, 200, 535), (0, 800, 200, 880),
                  (570, 215, 650, 280)],                     # nimble 2's motion lines (on the floor line: they'd hold the hop down)
            rows=[('nimble', (322, 40, 1448, 292), (293, 322), NUM(4)),
                  ('hide', (200, 340, 1448, 600), (601, 629), NUM(4)),
                  ('climb', (150, 660, 1448, 985), (986, 1014), NUM(6))]),
    3: dict(file='Goblin-GPT3.png',
            text=[(0, 85, 175, 140), (0, 268, 120, 320), (0, 455, 175, 508), (0, 628, 190, 692), (0, 805, 265, 860), (0, 952, 140, 1025)],
            rows=[('idle', (175, 20, 1448, 170), (171, 194), NUM(6)),
                  ('walk', (120, 200, 1448, 351), (352, 378), NUM(8)),
                  ('scimitar', (175, 385, 1448, 534), (535, 559), NUM(6)),
                  ('shortbow', (190, 565, 1448, 718), (719, 746), NUM(6)),
                  ('nimble', (265, 748, 1448, 884), (887, 918), NUM(4)),
                  ('flinch', (175, 920, 1448, 1053), (1054, 1076), NUM(4))]),
    4: dict(file='Goblin-GPT4.png',
            text=[(0, 70, 175, 125), (0, 205, 175, 265), (0, 345, 175, 405), (0, 502, 185, 548), (0, 620, 245, 700), (0, 782, 175, 840),
                  (0, 925, 175, 982)],
            rows=[('idle', (175, 20, 1448, 140), (141, 163), NUM(5)),
                  ('walk', (175, 170, 1448, 284), (285, 305), NUM(8)),
                  ('scimitar', (175, 310, 1448, 432), (433, 452), NUM(6)),
                  ('shortbow', (185, 460, 1448, 581), (582, 601), NUM(6)),
                  ('nimble', (245, 605, 1448, 722), (723, 741), NUM(4)),
                  ('flinch', (175, 750, 1448, 861), (862, 880), NUM(4)),
                  ('climb', (175, 885, 1448, 1035), (1036, 1055), NUM(6))]),
}
SHEETS[1]['text'].append((0, 0, 380, 206))                 # the portrait (its lower edge lies in the idle row's band)
SHEETS[2]['text'].append((560, 190, 662, 286))               # nimble 2's motion lines (on the floor line: they would hold the hop down)
SHEETS[3]['text'] += [(520, 780, 582, 892), (780, 820, 822, 892), (950, 830, 992, 896),   # nimble 2's and 3's motion lines, the same
                      (383, 890, 402, 917), (620, 880, 642, 907), (872, 882, 894, 909), (1123, 889, 1147, 917)]   # its numbers (beside the feet)
SHEETS[3]['rows'][4] = ('nimble', (265, 748, 1448, 889), (889, 918), NUM(4))
SHEETS[4]['text'].append((0, 860, 900, 882))                 # the flinch row's numbers, so the climb's band can reach climb 6's fingertips
SHEETS[4]['rows'][6] = ('climb', (175, 866, 1448, 1035), (1036, 1055), NUM(6))
# ART-24 (10-14): the diagonals, and the front and back of the fall, prone and hide -- the boxes read off the pages by their white labels
ART24 = os.path.join('goblin', 'ART-24')
SHEETS.update({
    'H1P1': dict(file=os.path.join(ART24, 'ART-24_HEAD-1_PAGE-1.png'),
                 text=[(0, 150, 165, 195), (0, 370, 120, 415), (0, 610, 160, 650), (0, 840, 165, 880)],
                 rows=[('idle', (160, 80, 1491, 245), (248, 273), NUM(6)),
                       ('walk', (130, 325, 1491, 470), (473, 498), NUM(8)),
                       ('scimitar', (165, 525, 1491, 713), (716, 742), NUM(6)),
                       ('shortbow', (165, 770, 1491, 955), (958, 983), NUM(6))]),
    'H1P2': dict(file=os.path.join(ART24, 'ART-24_HEAD-1_PAGE-2.png'),
                 text=[(0, 95, 165, 140), (0, 280, 120, 325), (0, 480, 150, 520), (0, 670, 285, 720), (0, 865, 125, 910)]
                      + [(x - 12, 378, x + 12, 410) for x in (254, 474, 674, 914, 1162, 1400)],    # the fall's numbers: its dropped blades reach
                 rows=[('flinch', (165, 30, 1536, 173), (174, 200), NUM(4)),                           # their strip, so it starts under them
                       ('fall', (150, 215, 1536, 392), (392, 408), NUM(6)),
                       ('prone', (150, 445, 1536, 562), (563, 590), NUM(2)),
                       ('nimble', (290, 590, 1536, 771), (772, 800), NUM(4)),
                       ('hide', (140, 830, 1536, 958), (960, 990), NUM(4))]),
    'H2P1': dict(file=os.path.join(ART24, 'ART-24_HEAD-2_PAGE-1.png'),
                 text=[(0, 100, 120, 145), (0, 300, 140, 340), (0, 500, 200, 545), (0, 715, 215, 760)],
                 rows=[('idle', (200, 20, 1774, 179), (180, 210), NUM(6)),
                       ('walk', (150, 232, 1774, 384), (385, 415), NUM(8)),
                       ('scimitar', (200, 425, 1774, 592), (593, 623), NUM(6)),
                       ('shortbow', (215, 625, 1774, 814), (815, 845), NUM(6))]),
    'H2P2': dict(file=os.path.join(ART24, 'ART-24_HEAD-2_PAGE-2.png'),
                 text=[(0, 100, 150, 140), (0, 295, 74, 335), (0, 500, 140, 540), (0, 690, 260, 740), (0, 900, 115, 940)],
                 rows=[('flinch', (150, 25, 1491, 184), (185, 213), NUM(4)),
                       ('fall', (74, 215, 1491, 376), (376, 405), NUM(6)),
                       ('prone', (150, 432, 1491, 571), (572, 600), NUM(2)),
                       ('nimble', (260, 608, 1491, 787), (788, 817), NUM(4)),
                       ('hide', (120, 838, 1491, 986), (987, 1016), NUM(4))]),
    'H3P1': dict(file=os.path.join(ART24, 'ART-24_HEAD-3_PAGE-1.png'),
                 text=[(0, 220, 150, 280), (0, 525, 205, 580), (0, 780, 175, 840)],
                 rows=[('fall', (160, 135, 1536, 348), (349, 380), NUM(6)),
                       ('prone', (210, 465, 1536, 627), (628, 662), NUM(2)),
                       ('hide', (180, 712, 1536, 910), (912, 948), NUM(4))]),
    'H5P1': dict(file=os.path.join(ART24, 'ART-24_HEAD-5_PAGE-1.png'),
                 text=[(0, 175, 92, 215), (0, 455, 135, 495), (0, 705, 115, 748),
                       (266, 263, 292, 276)],                  # a grey dash under Fall 1's foot (a stray mark: it would set the row's floor)
                 rows=[('fall', (95, 25, 1774, 286), (287, 332), NUM(6)),
                       ('prone', (140, 370, 1774, 547), (548, 588), NUM(2)),
                       ('hide', (120, 640, 1774, 810), (811, 852), NUM(4))]),
})
# loose bits moved by hand: sheet -> row -> [(box x0 y0 x1 y1 on the sheet: every blob wholly inside it, the label it belongs to)]
FIX = {1: {'scimitar': [((676, 438, 776, 512), '3')]},        # 3's swing arc: its thick middle seeds a core of its own, nearer 4's label,
       4: {'scimitar': [((686, 310, 780, 394), '3')]}}        # so it is cut from the blade (CUT) and handed back to 3
CUT = {1: {'scimitar': [[(679, 470), (679, 512)]]},          # the blade where it is thinnest, short of the arc
       4: {'scimitar': [[(689, 350), (689, 394)]]}}
TOUCH_OK = {1: {'scimitar'}, 4: {'scimitar'}}                # (the arc against the blade it leaves: looked at 10-07)

# the scale, sheet px a game px: by the figure's area against sheet 1's turnaround (one goblin at one scale from four sides; heights lie, the
# side rows crouch deeper than its Right view). sqrt(area): the side idle 72.5 to the turnaround's Right 90.5 (0.801), the front idle 110.0 to its
# Front 99.1 (1.110), the back idle 81.2 to its Back 98.8 (0.822); sheet 2's guard crouch (nimble 1 and 4) 135.9 to sheet 1's idle 72.5 (1.874).
# K[1] sets the size: the hunched side idle (82 px on the sheet) about 36 px.
K = {1: 2.28}
K.update({2: K[1] * 1.874, 3: K[1] * 1.110 / 0.801, 4: K[1] * 0.822 / 0.801})
# ART-24 (10-14), no turnaround: each view's idle (or the frame of the idle's pose) to the facings beside it as committed, by the same
# measure and by height (the docstring has the numbers); a page 2 by its page 1, by area
K.update({'H1P1': 3.77, 'H2P1': 3.52, 'H3P1': 4.38, 'H5P1': 3.85})
K.update({'H1P2': K['H1P1'] * 0.945, 'H2P2': K['H2P1'] * 1.02})
# a row GPT drew bigger than its page's idle: HEAD 2's Shortbow, its goblin a tenth larger (the head 44 px wide to the idle's 40, crown to
# feet 153 to 142; its area carries the bow, so not by that)
KROW = {('H2P1', 'shortbow'): 1.10}
# the colour, sheet by sheet, to sheet 1's (his look's): GPT drew the front, the back and the tricks a more yellow green than the side rows --
# the skin's blue at game size 41 (sheet 3), 52 (4), 51 (2) to sheet 1's 63, the leather redder. Each channel times a factor, the skin's and the
# leather's apart (means at game size: skin 134/147/63, leather 111/68/37 on sheet 1); the steel and the whites left be
TONE = {2: ((0.965, 0.950, 1.22), (0.93, 0.94, 0.88)),
        3: ((0.920, 0.915, 1.51), (0.90, 0.93, 1.01)),
        4: ((1.020, 1.040, 1.20), (0.88, 0.93, 0.86))}
# ART-24 (10-14) the same way, each page's means at its game size to sheet 1's (skin 135/148/63, the rest 113/76/42 by this cutter's
# classes): GPT drew them all with less blue in the skin; HEAD 2's first page drew the skin a warmer yellow (red over green), so its skin test
# leans 15 (the third number) and its factors are taken against sheet 1's at the same lean (skin 133/142/60, the rest 111/70/41)
TONE.update({'H1P1': ((0.984, 1.018, 1.30), (0.984, 1.035, 1.20)),
             'H1P2': ((1.003, 0.996, 1.37), (0.989, 1.087, 1.18)),
             'H2P1': ((0.939, 1.038, 1.32), (0.996, 1.153, 1.23), 15),
             'H2P2': ((1.034, 1.008, 1.45), (0.946, 1.062, 1.07)),
             'H3P1': ((1.074, 1.040, 1.79), (0.929, 0.986, 1.12)),
             'H5P1': ((1.033, 1.036, 1.74), (0.949, 1.090, 1.12))})
FRONT = ['idle', 'walk', 'scimitar', 'shortbow', 'nimble', 'flinch']      # sheet 3, facing S
BACK = FRONT + ['climb']                                                    # sheet 4, facing N
SIDE = {'idle': 1, 'walk': 1, 'scimitar': 1, 'shortbow': 1, 'flinch': 1, 'fall': 1, 'prone': 1, 'nimble': 2, 'hide': 2, 'climb': 2}
PAGE1 = ['idle', 'walk', 'scimitar', 'shortbow']                            # ART-24: a diagonal's first page; its second the rest
DIAG = PAGE1 + ['flinch', 'fall', 'prone', 'nimble', 'hide']
# the views: the drawn row each plays, (sheet, its row)
VIEWS = {'side': {r: (L, r) for r, L in SIDE.items()},
         'front': {r: (3, r) for r in FRONT},
         'back': {r: (4, r) for r in BACK},
         'HEAD1': {r: ('H1P1' if r in PAGE1 else 'H1P2', r) for r in DIAG},       # SE
         'HEAD2': {r: ('H2P1' if r in PAGE1 else 'H2P2', r) for r in DIAG},       # NE
         'HEAD3': {r: ('H3P1', r) for r in ('fall', 'prone', 'hide')},           # S
         'HEAD5': {r: ('H5P1', r) for r in ('fall', 'prone', 'hide')}}           # N
# per facing (deep16/js/sprites.js S.FACINGS: 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE): the views it takes, (view, mirrored?), the first
# that draws the row playing it. RULED 10-14, five drawn views: S, SE (SW mirrored), E (W mirrored), NE (NW mirrored), N
FACING = {0: (('front', False), ('HEAD3', False), ('side', False)),
          1: (('HEAD1', True), ('side', True)),
          2: (('side', True),),
          3: (('HEAD2', True), ('side', True)),
          4: (('back', False), ('HEAD5', False), ('side', False)),
          5: (('HEAD2', False), ('side', False)),
          6: (('side', False),),
          7: (('HEAD1', False), ('side', False))}
PAD = {(4, 'idle'): [0, 1, 2, 3, 4, 3]}                      # sheet 4 drew five idle frames to the others' six: 1 2 3 4 5 4
FLOOR = {(L, 'fall'): 0 for L in ('H1P2', 'H2P2', 'H3P1', 'H5P1')}   # ART-24's falls: the row's floor at its first frame's feet (it stands
                                                                    # where the idle stood; the body lying lower on the page lies below the foot)
RELEASE = {'shortbow': 4}                                    # the frame the arrow leaves on (frame 5: the bow hand open), js/battle.js times the shot by it
FH, AY = 96, 84


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of the body's thick middle (torso and head; the blade, the bow and the limbs are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def toned(img, f):
    """the skin (green over red, and over blue by 30) times f[0], the rest times f[1], the greys (steel, the arcs, the eyes' whites) left be;
    f[2], when there, leans the skin test: green over red less that (a page that drew the skin warmer)"""
    a = np.asarray(img).astype(float)
    rgb = a[..., :3]
    lean = f[2] if len(f) > 2 else 0
    skin = (rgb[..., 1] > rgb[..., 0] - lean) & (rgb[..., 1] > rgb[..., 2] + 30)
    grey = rgb.max(-1) - rgb.min(-1) < 25
    rgb[skin] *= np.array(f[0], float)
    rgb[~skin & ~grey] *= np.array(f[1], float)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


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
    cuts = {}
    for L, s in SHEETS.items():
        over = [] if check else None
        cuts[L] = SR.cut_sheet(os.path.join(SRC, s['file']), s, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag=str(L))
        if check:
            out = os.path.join(ROOT, 'dev', 'visions', 'goblin'); os.makedirs(out, exist_ok=True)
            over[0].save(os.path.join(out, 'cut-%s.png' % L))
    # every frame at game size: (1x RGBA, its body's middle, its height off its row's floor)
    small = {}
    for L, c in cuts.items():
        for row, frs in c.items():
            floor = frs[FLOOR[(L, row)]][2][3] if (L, row) in FLOOR else max(b[3] for _, _, b in frs)
            k = K[L] * KROW.get((L, row), 1)
            out = []
            for nm, im, box in frs:
                sm = game_size(toned(im, TONE[L]) if L in TONE else im, k)
                a = pix.pixelate(sm, 1, do_lift=False)
                out.append((a, core_x(a), int(round((floor - box[3]) / k))))
            small[(L, row)] = [out[i] for i in PAD.get((L, row), range(len(out)))]
    # the engine's rows, by facing (S, SW, W, NW, N, NE, E, SE), each facing the first view in FACING that draws the row
    eng = {'idle': 'idle', 'walk': 'walk', 'scimitar': 'scimitar', 'attack': 'scimitar', 'shortbow': 'shortbow', 'nimble': 'nimble',
           'hide': 'hide', 'climb': 'climb', 'flinch': 'flinch', 'hurt': 'fall', 'prone': 'prone'}
    src, took = {}, {}
    for name, row in eng.items():
        per = []
        for f in range(8):
            view, mirrored = next((v, mi) for v, mi in FACING[f] if row in VIEWS[v])
            fs = small[VIEWS[view][row]]
            if row == 'prone':
                fs = fs[::-1]                                # pushing up, then lying: it lies at its last frame and gets up by playing it backwards
            per.append((fs, mirrored))
            took.setdefault(name, []).append(view + ('m' if mirrored else ''))
        counts = {len(fs) for fs, _ in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (name, sorted(counts)))
        src[name] = per
    print('  facings (S SW W NW N NE E SE) <- view (m mirrored): ' + '; '.join('%s %s' % (e, ' '.join(t)) for e, t in took.items()))
    frames, sizes, lost = {}, {}, []
    for name, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs, _ in per for a, cx, _ in fs)    # each row its own width, about the frame's middle (so a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        ax = fw // 2
        sizes[name] = (fw, FH, ax, AY)
        frames[name] = []
        for f, (fs, mirrored) in enumerate(per):
            row = []
            for a, cx, up in fs:
                if mirrored:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, cut = place(a, cx, up, fw, ax)
                if cut:
                    lost.append('%s facing %d' % (name, f))
                row.append(fr)
            frames[name].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    pix.write_sheet('goblin_p2', frames, 96, FH, 48, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'goblin_p2.json')
    meta = json.load(open(meta_p))
    for name, k in RELEASE.items():
        meta['anims'][name]['release'] = k
    meta['source'] = ('generated by Griz (2026-10-07: four GPT sheets -- the side rows, its tricks, from the front, from behind) and the art desk '
                      '(2026-10-14, ART-24: the SE and NE views, the front and back of the fall, prone and hide), cut by tools/goblin-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    sq = lambda fr: np.sqrt(ndimage.binary_fill_holes(fr[..., 3] > 0).sum())
    print('  idle height (opaque, with the outline) min-max/median and sqrt(area) median, by facing: ' + '; '.join(
        '%s %d-%d/%g %.1f' % (FN[f], min(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]),
                              max(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]),
                              np.median([h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]]), np.median([sq(fr) for fr in frames['idle'][f]]))
        for f in range(8)))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'goblin')
        facings(frames, sizes, d)
        lineup(frames, sizes, os.path.join(d, 'lineup.png'))


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames, sizes, d):
    """every facing of every row, S SW W NW N NE E SE top to bottom, on a grey floor (the foot's line drawn)"""
    for name, per in frames.items():
        fw = sizes[name][0]
        n = len(per[0])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (fw + 4), f * FH))
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % name))


def lineup(frames, sizes, path):
    """the goblin's idle frame 1 in all eight facings (S SW W NW N NE E SE), then the hobgoblin (Medium) beside it, at 4x on a grey floor"""
    figs = [(frames['idle'][f][0], AY) for f in range(8)]
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'hobgoblin_p2.json')))
    an = m['anims']['idle']
    hob = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', 'hobgoblin_p2.png')).convert('RGBA'))
    figs.append((hob[an['y'] + 6 * an['fh']:an['y'] + 7 * an['fh'], 0:an['fw']], an['ay']))
    top = max(ay for _, ay in figs)
    W = sum(a.shape[1] for a, _ in figs)
    H = top + max(a.shape[0] - ay for a, ay in figs)
    cv = np.zeros((H, W, 4), np.uint8); cv[..., :3] = (70, 74, 70); cv[..., 3] = 255
    x = 0
    for a, ay in figs:
        sub = cv[top - ay:top - ay + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[..., :3] = (a[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        x += a.shape[1]
    cv[top + 1, :, :3] = (200, 60, 60)
    Image.fromarray(cv).resize((W * 4, H * 4), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])
