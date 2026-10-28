"""DEEP16 pipeline 2 (generated art): the art desk's winter wolf pages -> winterwolf_p1, a creature new to the grid (10-22, the monster cutter
seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all tueday"; asked 10-08 among "a
creature a biome": deep16-srd-not-yet.md).

    python tools/winterwolf-sheet.py            # deep16/art/winterwolf_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/winterwolf/ -- a worktree reads them there): ART-11 (10-10), HEAD 1 SE and HEAD 2
NE on two pages each -- SE's first page his pick, "Corrected winter wolf sprite sheet.png" (his reason: the zip's first bite did not read as a
bite), with a portrait and a turnaround above its rows (not cut; the turnaround measured once for the front and back heights below); ART-54
(10-19, sorted already into _src/winterwolf/ART-54/), HEAD 3 S, HEAD 4 E and HEAD 5 N on seven pages each, one action a page: Idle 6, Run 8,
Bite 6, Cold Breath 6 (S and E on two lines, 1-3 and 4-6), Flinch 4, Fall 6, Prone 2.
What each became: idle, walk <- Run, attack <- Bite, breath <- Cold Breath (js/traits.js M.breathe plays a sheet's own breath row), flinch,
hurt <- Fall (played once, down at the end), prone <- Prone played backwards (it lies at its last and rises by playing it back, the axe
beak's way). Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE.
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 52 px side-on, a Large wolf a head over the worg (48); from the front
and behind 56, the art desk's turnaround's front and back against its three-quarter (163 and 162 to 150, one page). A later page by its first
frame (Run 1 and Bite 1 stand within 5% of the idle on the ART-11 pages, where they share one), a Fall page by its Fall 1, and a Prone page by
Prone 1 at 1.07 of its own view's Fall 6 (the ART-11 pages: 1.11 SE, 1.04 NE -- both lie on the ground). Two passes: the second tones every page
per channel to its own view's first-pass idle, and the SE and NE (ART-11, drawn nine days before) to the E's.
The pages' boxes read by the seat's probe (the numbers are white islands, the frost a bluer white): the breath rows' numbers sit among the
frost, so each digit is boxed (`own_strip`); SE's peak cone hangs down beside the flinch below it (`away`, each band its corner) and every cone
goes to its own frame (`fix`: a loose crystal goes to the nearest body, and the next wolf is often nearer); S's and E's Flinch 2 yelp ticks
are boxed out as lettering (the art desk: "Exclude ... small yelp ticks on S/E Flinch2 from creature masks").
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

NAME = 'winterwolf_p1'
FW, FH, AX, AY = 228, 142, 114, 96         # (the breath: E's and W's jet 111 px ahead of the anchor, NE's cone 93 above, SE's 44 below the paws)
STAND = {'side': 52, 'S': 56, 'N': 56}
PRONE_FALL6 = 1.07

P11 = dict(dir='', W=1983)                              # (ART-11's pages lie in _src/winterwolf/ itself)
D11_SE = [(319, 207, 335, 234), (557, 208, 575, 234), (816, 209, 834, 236), (1083, 209, 1103, 236), (1407, 209, 1425, 236), (1708, 210, 1727, 236)]
D11_NE = [(324, 249, 342, 277), (584, 249, 604, 277), (838, 249, 857, 277), (1104, 249, 1126, 277), (1398, 249, 1417, 277), (1704, 249, 1723, 277)]
PAGES = {
  'H1P1': dict(P11, file='Corrected winter wolf sprite sheet.png', text=[(29, 291, 107, 329), (29, 465, 105, 502), (29, 647, 107, 683)],
               rows=[('idle', (0, 232, 1983, 405), (380, 402), 6), ('walk', (0, 406, 1983, 585), (559, 582), 8), ('attack', (0, 586, 1983, 768), (743, 765), 6)]),
  'H1P2': dict(P11, file='ART-11_HEAD-1_PAGE-2.png', own_strip=['breath'],
               text=[(18, 128, 215, 175), (27, 292, 119, 329), (116, 292, 140, 329), (30, 467, 101, 505), (28, 648, 133, 684)] + D11_SE,
               away={'breath': [(0, 237, 1170, 330)], 'flinch': [(1170, 237, 1983, 330)]},
               rows=[('breath', (0, 0, 1983, 330), (209, 233), 6), ('flinch', (0, 237, 1983, 413), (386, 410), 4), ('hurt', (0, 414, 1983, 589), (560, 586), 6),
                     ('prone', (0, 590, 1983, 760), (734, 757), 2)]),
  'H2P1': dict(P11, file='ART-11_HEAD-2_PAGE-1.png', text=[(30, 135, 111, 174), (29, 354, 106, 392), (29, 604, 110, 642)],
               rows=[('idle', (0, 0, 1983, 255), (229, 252), 6), ('walk', (0, 256, 1983, 503), (477, 500), 8), ('attack', (0, 504, 1983, 751), (724, 748), 6)]),
  'H2P2': dict(P11, file='ART-11_HEAD-2_PAGE-2.png', own_strip=['breath'],
               text=[(20, 140, 220, 190), (28, 329, 112, 364), (109, 329, 132, 364), (28, 495, 94, 531), (28, 658, 129, 693)] + D11_NE,
               rows=[('breath', (0, 0, 1983, 277), (251, 274), 6), ('flinch', (0, 278, 1983, 449), (427, 450), 4), ('hurt', (0, 449, 1983, 609), (592, 615), 6),   # (the
                     ('prone', (0, 609, 1983, 781), (750, 778), 2)]),                  # rows below raise their ears into the strip above: the bands end over them)
  # ART-54: one action a page (2172 x 724; N's Prone 1774 x 887)
  'H3P1': dict(file='ART-54_HEAD-3_PAGE-1.png', W=2172, text=[(41, 338, 158, 391)], rows=[('idle', (0, 0, 2172, 578), (535, 575), 6)]),
  'H3P2': dict(file='ART-54_HEAD-3_PAGE-2.png', W=2172, text=[(30, 351, 136, 403)], rows=[('walk', (0, 0, 2172, 581), (539, 578), 8)]),
  'H3P3': dict(file='ART-54_HEAD-3_PAGE-3.png', W=2172, text=[(42, 354, 198, 422)], rows=[('attack', (0, 0, 2172, 602), (552, 599), 6)]),
  'H3P4': dict(file='ART-54_HEAD-3_PAGE-4.png', W=2172, own_strip=['breath', 'breath2'],
               text=[(47, 149, 112, 193), (112, 149, 294, 193), (293, 149, 347, 193), (47, 491, 112, 535), (112, 491, 294, 535), (294, 491, 347, 535),
                     (545, 288, 566, 325), (1103, 287, 1128, 324), (1696, 341, 1721, 377), (639, 674, 666, 711), (1262, 674, 1286, 711), (1840, 646, 1864, 682)],
               rows=[('breath', (0, 0, 2172, 377), (289, 374), 3), ('breath2', (0, 378, 2172, 711), (648, 708), 3)]),
  'H3P5': dict(file='ART-54_HEAD-3_PAGE-5.png', W=2172, text=[(38, 314, 202, 379), (203, 314, 244, 379), (735, 194, 788, 296)],
               rows=[('flinch', (0, 0, 2172, 621), (572, 618), 4)]),
  'H3P6': dict(file='ART-54_HEAD-3_PAGE-6.png', W=2172, text=[(24, 352, 120, 402)], rows=[('hurt', (0, 0, 2172, 596), (553, 593), 6)]),
  'H3P7': dict(file='ART-54_HEAD-3_PAGE-7.png', W=2172, text=[(70, 360, 303, 429)], rows=[('prone', (0, 0, 2172, 649), (595, 646), 2)]),
  'H4P1': dict(file='ART-54_HEAD-4_PAGE-1.png', W=2172, text=[(35, 311, 139, 358)], rows=[('idle', (0, 0, 2172, 471), (436, 468), 6)]),
  'H4P2': dict(file='ART-54_HEAD-4_PAGE-2.png', W=2172, text=[(26, 336, 117, 379)], rows=[('walk', (0, 0, 2172, 490), (458, 487), 8)]),
  'H4P3': dict(file='ART-54_HEAD-4_PAGE-3.png', W=2172, text=[(20, 314, 131, 364)], rows=[('attack', (0, 0, 2172, 504), (465, 501), 6)]),
  'H4P4': dict(file='ART-54_HEAD-4_PAGE-4.png', W=2172, own_strip=['breath', 'breath2'],
               text=[(31, 332, 276, 381), (277, 332, 338, 381), (526, 297, 548, 336), (1141, 297, 1169, 336), (1775, 297, 1802, 336),
                     (478, 625, 509, 665), (1158, 625, 1185, 664), (1857, 625, 1885, 664)],
               rows=[('breath', (0, 0, 2172, 336), (299, 333), 3), ('breath2', (0, 337, 2172, 665), (627, 662), 3)]),
  'H4P5': dict(file='ART-54_HEAD-4_PAGE-5.png', W=2172, text=[(63, 343, 214, 398), (214, 343, 250, 398), (1094, 203, 1148, 280)],
               rows=[('flinch', (0, 0, 2172, 554), (505, 551), 4)]),
  'H4P6': dict(file='ART-54_HEAD-4_PAGE-6.png', W=2172, text=[(35, 333, 99, 379), (100, 333, 130, 379)], rows=[('hurt', (0, 0, 2172, 483), (447, 480), 6)]),
  'H4P7': dict(file='ART-54_HEAD-4_PAGE-7.png', W=2172, text=[(115, 305, 370, 390)], rows=[('prone', (0, 0, 2172, 591), (529, 588), 2)]),
  'H5P1': dict(file='ART-54_HEAD-5_PAGE-1.png', W=2172, text=[(42, 347, 180, 409)], rows=[('idle', (0, 0, 2172, 594), (545, 591), 6)]),
  'H5P2': dict(file='ART-54_HEAD-5_PAGE-2.png', W=2172, text=[(41, 308, 156, 362)], rows=[('walk', (0, 0, 2172, 576), (535, 573), 8)]),
  'H5P3': dict(file='ART-54_HEAD-5_PAGE-3.png', W=2172, text=[(40, 365, 171, 421)], rows=[('attack', (0, 0, 2172, 574), (531, 571), 6)]),
  'H5P4': dict(file='ART-54_HEAD-5_PAGE-4.png', W=2172, own_strip=['breath'],
               text=[(38, 464, 98, 510), (96, 464, 275, 510), (273, 464, 326, 510), (431, 636, 453, 676), (715, 636, 742, 677), (1005, 636, 1032, 677),
                     (1310, 636, 1340, 677), (1609, 636, 1635, 677), (1908, 636, 1935, 677)],
               rows=[('breath', (0, 0, 2172, 677), (638, 674), 6)]),
  'H5P5': dict(file='ART-54_HEAD-5_PAGE-5.png', W=2172, text=[(48, 333, 229, 398), (231, 334, 273, 398)], rows=[('flinch', (0, 0, 2172, 618), (568, 615), 4)]),
  'H5P6': dict(file='ART-54_HEAD-5_PAGE-6.png', W=2172, text=[(37, 351, 118, 411), (123, 351, 163, 411)], rows=[('hurt', (0, 0, 2172, 595), (547, 592), 6)]),
  'H5P7': dict(file='ART-54_HEAD-5_PAGE-7.png', W=1774, text=[(60, 385, 370, 480)], rows=[('prone', (0, 0, 1774, 723), (658, 720), 2)]),
}
# every row's numbers by hand (the probe's white islands): the frost and the fur's highlights would read as numbers in a strip
XS = {'H1P1': {'idle': [256, 490, 716, 948, 1173, 1420], 'walk': [246, 488, 716, 939, 1169, 1416, 1635, 1848], 'attack': [269, 502, 746, 1008, 1254, 1492]},
      'H1P2': {'breath': [327, 566, 825, 1093, 1416, 1718], 'flinch': [309, 562, 814, 1072], 'hurt': [284, 562, 830, 1137, 1455, 1789], 'prone': [301, 578]},
      'H2P1': {'idle': [304, 542, 766, 1010, 1242, 1474], 'walk': [265, 476, 708, 928, 1150, 1374, 1603, 1814], 'attack': [298, 562, 840, 1112, 1374, 1664]},
      'H2P2': {'breath': [333, 594, 848, 1115, 1408, 1714], 'flinch': [342, 606, 848, 1112], 'hurt': [322, 602, 876, 1144, 1466, 1788], 'prone': [322, 612]},
      'H3P1': {'idle': [354, 682, 995, 1318, 1645, 1974]}, 'H3P2': {'walk': [266, 518, 784, 1034, 1298, 1539, 1800, 2046]},
      'H3P3': {'attack': [414, 720, 1022, 1332, 1644, 1910]}, 'H3P4': {'breath': [556, 1116, 1708], 'breath2': [652, 1274, 1852]},
      'H3P5': {'flinch': [457, 926, 1408, 1916]}, 'H3P6': {'hurt': [300, 588, 871, 1172, 1533, 1950]}, 'H3P7': {'prone': [723, 1527]},
      'H4P1': {'idle': [340, 658, 984, 1300, 1628, 1952]}, 'H4P2': {'walk': [270, 525, 782, 1036, 1290, 1542, 1787, 2019]},
      'H4P3': {'attack': [295, 616, 946, 1284, 1640, 1970]}, 'H4P4': {'breath': [537, 1155, 1788], 'breath2': [494, 1172, 1871]},
      'H4P5': {'flinch': [501, 947, 1398, 1844]}, 'H4P6': {'hurt': [321, 636, 953, 1273, 1620, 1972]}, 'H4P7': {'prone': [812, 1582]},
      'H5P1': {'idle': [360, 678, 978, 1284, 1599, 1912]}, 'H5P2': {'walk': [316, 552, 796, 1036, 1283, 1523, 1768, 2014]},
      'H5P3': {'attack': [330, 632, 944, 1270, 1604, 1961]}, 'H5P4': {'breath': [442, 728, 1018, 1325, 1622, 1922]},
      'H5P5': {'flinch': [481, 890, 1312, 1733]}, 'H5P6': {'hurt': [333, 640, 944, 1266, 1600, 1973]}, 'H5P7': {'prone': [706, 1416]}}
for _L, _x in XS.items():
    PAGES[_L]['xs'] = dict(PAGES[_L].get('xs', {}), **_x)
# each cone to its own frame (a box wholly round its loose crystals and puffs; the wolf it comes from is not inside, nor the next one)
FIX = {'H2P1': {'idle': [((410, 50, 460, 95), '1')]},                    # (each idle's breath puff ahead of its own nose: frame 1's lay nearer frame 2)
       'H4P1': {'idle': [((1105, 308, 1152, 358), '3'), ((1748, 305, 1798, 363), '5')]},
       'H1P2': {'breath': [((630, 165, 700, 215), '2'), ((880, 140, 982, 222), '3'), ((1148, 150, 1350, 330), '4'), ((1462, 140, 1625, 262), '5')]},
       'H2P2': {'breath': [((675, 115, 722, 165), '2'), ((905, 60, 1032, 158), '3'), ((1170, 0, 1425, 172), '4'), ((1462, 40, 1628, 160), '5')]},
       'H4P4': {'breath2': [((655, 415, 910, 595), '1'), ((1315, 460, 1550, 570), '2')]}}
VIEWS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': tuple('H3P%d' % i for i in range(1, 8)), 'E': tuple('H4P%d' % i for i in range(1, 8)),
         'N': tuple('H5P%d' % i for i in range(1, 8))}
# a crystal of NE's cone 4 is a core of its own (seeded by its x, nearest frame 5's number) and touches the cone: a line frees it for FIX
CUTS = {'H2P2': {'breath': [(1327, 64, 1327, 94), (1326, 92, 1368, 92)]}}
JOINS = {'breath2': 'breath'}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'breath', 'prone']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'breath': 8, 'prone': 6}
# no frost puff on the idle (10-28, Griz, his ear file: "I remember the winter wolf's cold breath looked like a static speech bubble on idle"):
# the art desk drew a puff of breath at the muzzle on the idles (SE and NE every frame, E and N some), loose on the page; at game speed it
# hung there like a speech bubble. An idle frame keeps its body alone -- its biggest piece, and any piece a quarter of that -- the breath row's
# own frost untouched
from scipy import ndimage as _nd
def _body_only(im):
    a = np.asarray(im).copy()
    lab, n = _nd.label(a[..., 3] > 0, structure=np.ones((3, 3)))
    if n < 2:
        return im, 0
    sz = _nd.sum(a[..., 3] > 0, lab, range(1, n + 1))
    keep = 1 + np.where(sz >= 0.25 * sz.max())[0]
    gone = ~np.isin(lab, keep) & (lab > 0)
    a[gone, 3] = 0
    return Image.fromarray(a, 'RGBA'), int(gone.sum())
_cut0, _tones0, _PUFF, _RAW = AD.cut, AD.tones, [False], [None]
_scales0 = AD.scales
def _tones(cuts, *a, **k):                     # (the tones and the scales measured on the cut as it was, puffs and all: every other row byte for byte)
    return _tones0(_RAW[0] or cuts, *a, **k)
def _scales(cuts, *a, **k):
    return _scales0(_RAW[0] or cuts, *a, **k)
AD.tones, AD.scales = _tones, _scales
# SE's puffs touch the nose on the page (five of six), N's Idle 5 joins its ear: boxed by hand, page px, the blue-grey frost by the head
PUFF_AWAY = {'H1P1': {'idle': [(344, 303, 374, 334), (582, 301, 611, 331), (812, 303, 840, 332), (1036, 313, 1066, 343), (1268, 310, 1299, 340), (1513, 303, 1546, 333)]},
             'H5P1': {'idle': [(1644, 155, 1715, 228)]}}       # (and N's Idle 5: its puff beside the ear, joined to it at the cut)
def _cut(*a, **k):
    out = _cut0(*a, **k)
    if not _PUFF[0]:
        return out
    _RAW[0] = {L: dict(rows) for L, rows in out.items()}
    pages = dict(a[3])
    for L, aw in PUFF_AWAY.items():
        if L in pages:
            pages[L] = dict(pages[L], away=dict(pages[L].get('away', {}), **aw))
    out = _cut0(*(a[:3] + (pages,) + a[4:]), **k)
    for L, rows in out.items():
        for r in rows:
            if r.split('_')[0] == 'idle':
                fr = [(_body_only(im) if im is not None else (None, 0), box, x) for im, box, x in rows[r]]
                if any(g for (_, g), _, _ in fr):
                    print('  %s %s: puffs off %s page px' % (L, r, [g for (_, g), _, _ in fr]))
                rows[r] = [(im, box, x) for (im, _), box, x in fr]
    return out
AD.cut = _cut


def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the ears above and the legs below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 30 // 100: top + (bot - top) * 70 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def foot(a):
    """the row a breath frame stands on: the lowest row of its body with the frost left out (light blue -- blue over red by 12, not dark --
    off the mask, then the biggest piece): each breath frame stood on its paws, not on the frost below them"""
    al = a[..., 3] > 0
    rgb = a[..., :3].astype(int)
    m = al & ~((rgb[..., 2] - rgb[..., 0] > 12) & (rgb.mean(-1) > 110))
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if not n:
        return int(np.where(al.any(axis=1))[0][-1])
    body = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    return int(np.where(body.any(axis=1))[0][-1])
FEET = {('H3P4', 'breath'): foot, ('H3P4', 'breath2'): foot}     # (S alone: its frost lies under the paws; SE's cone joins the body, so it keeps the page's own ground)


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def prone_targets():
    """each ART-54 Prone page: its Prone 1 at PRONE_FALL6 of its own view's Fall 6, at game size (the view's Fall page scaled as artdesk does)"""
    cuts = AD.cut(ROOT, 'winterwolf', 'ART-54', PAGES, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit)
    out = {}
    for v, fall, prone in (('S', 'H3P6', 'H3P7'), ('E', 'H4P6', 'H4P7'), ('N', 'H5P6', 'H5P7')):
        f6 = AD.tall(fit(cuts[fall]['hurt'][5][0], K[fall]))
        out[prone] = ('prone', 0, round(f6 * PRONE_FALL6))
    print('  prone targets: ' + ', '.join('%s %d' % (L, t[2]) for L, t in out.items()))
    return out


def build():
    tg = prone_targets()
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, targets=tg, joins=JOINS, feet=FEET)
    first = AD.views(ROOT, 'winterwolf', 'ART-54', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    _PUFF[0] = True                      # (the idles' puffs off in the second pass only: the first pass's idles stay the tone refs they were)
    d = AD.views(ROOT, 'winterwolf', 'ART-54', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
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
    meta['source'] = ('drawn by the art desk (ART-11 SE and NE, 10-10, SE page 1 his pick "Corrected winter wolf sprite sheet"; ART-54 S, E and N, '
                      '10-19), cut by tools/winterwolf-sheet.py through tools/artdesk.py (10-22)')
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
