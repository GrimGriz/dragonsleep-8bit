"""DEEP16 pipeline 2 (generated art): the art desk's ankheg pages -> ankheg_p1, a creature new to the grid (10-22, the monster cutter seat's
second run, on Griz's "spin up an one-at-a-time art cutter that goes until we're out"; asked 10-08 as "a creature a biome", the plains:
deep16-srd-not-yet.md).

    python tools/ankheg-sheet.py            # deep16/art/ankheg_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/ankheg/ -- a worktree reads them there): ART-10 (10-10), HEAD 1 SE and HEAD 2 NE
on three pages each, its first page with a portrait and a turnaround above the rows (not used); ART-53 (10-19, sorted out of Fresh by
_src/art-desk/sort-delivery.py), HEAD 3 S, HEAD 4 E and HEAD 5 N the same three pages: Idle 6, Walk 8, Burrow 6; Burst 6, Bite 6, Acid Spray
6; Flinch 4, Fall 6, Prone 2. Burrow 6 is drawn empty on purpose in every view (under the ground, "No hole/floor remains"): an empty frame.
What each became: idle, walk, burrow (played once going under), reveal <- Burst, attack <- Bite, spray <- Acid Spray (cut and checked to fit, but not laid on the
sheet: no foe on the grid spits a line yet, and a row nothing plays only fails the show -- lay it, by adding spray to pixelate's
ANIM_ORDER and ROWS here, with the mechanic), flinch, hurt <- Fall (played once, belly up at the end), prone <- Prone played backwards
(getting up, then down kicking: it lies at its last and rises by playing it back, the axe beak's way). Facings: the five views as drawn,
SW, W and NW the mirrors of SE, E and NE.
Cut, scaled and placed by tools/artdesk.py: each view's Idle stands STAND px (a Large insect, long and low: between the giant boar's 51 and
the bulette's 67 -- the seat's call), a later page by its Fall 1 (standing) against its Idle 1, every frame against its number and its
row's ground. Two passes: the second tones every page per channel to its own view's first-pass idle, and the SE and NE (ART-10, drawn a
week earlier, the art desk's notes: its rear warmer and oranger) to the E's (ART-53).
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

NAME = 'ankheg_p1'
FW, FH, AX, AY = 180, 128, 90, 108         # (20 px under the foot: S's acid jet comes down toward the viewer)
STAND = 54

P10 = dict(dir='')                                       # (ART-10's pages lie in _src/ankheg/ itself)
PAGES = {
  'H1P1': dict(P10, file='ART-10_HEAD-1_PAGE-1.png', W=1774, text=[(17, 321, 90, 356), (9, 520, 85, 553), (4, 731, 107, 763)], blank={'burrow': 1},
               rows=[('idle', (0, 258, 1774, 433), (408, 433), 6), ('walk', (0, 434, 1774, 632), (605, 632), 8), ('burrow', (0, 633, 1774, 859), (833, 859), 6)]),
  'H1P2': dict(P10, file='ART-10_HEAD-1_PAGE-2.png', W=1774, xs={'spray': [268, 520, 788, 1061, 1339, 1610]}, text=[(24, 170, 197, 214), (24, 428, 114, 470), (13, 696, 170, 746)],
               rows=[('reveal', (0, 0, 1774, 300), (275, 300), 6), ('attack', (0, 301, 1774, 555), (529, 555), 6), ('spray', (0, 556, 1774, 836), (811, 836), 6)]),
  'H1P3': dict(P10, file='ART-10_HEAD-1_PAGE-3.png', W=1774, text=[(23, 135, 150, 176), (21, 421, 104, 463), (21, 694, 141, 736)],
               rows=[('flinch', (0, 0, 1774, 272), (242, 272), 4), ('hurt', (0, 273, 1774, 560), (523, 560), 6), ('prone', (0, 561, 1774, 840), (811, 840), 2)]),
  'H2P1': dict(P10, file='ART-10_HEAD-2_PAGE-1.png', W=1774, text=[(21, 161, 107, 201), (17, 419, 109, 458), (16, 693, 140, 731)], blank={'burrow': 1},
               rows=[('idle', (0, 0, 1774, 273), (245, 273), 6), ('walk', (0, 274, 1774, 550), (521, 550), 8), ('burrow', (0, 551, 1774, 840), (811, 840), 6)]),
  'H2P2': dict(P10, file='ART-10_HEAD-2_PAGE-2.png', W=1774, xs={'spray': [244, 498, 754, 1032, 1326, 1610]}, text=[(8, 166, 130, 203), (20, 433, 108, 471), (10, 692, 193, 735)],
               rows=[('reveal', (0, 0, 1774, 288), (256, 288), 6), ('attack', (0, 289, 1774, 573), (543, 573), 6), ('spray', (0, 574, 1774, 865), (828, 865), 6)]),
  'H2P3': dict(P10, file='ART-10_HEAD-2_PAGE-3.png', W=1774, text=[(20, 157, 140, 195), (20, 437, 99, 474), (20, 709, 130, 747)],
               rows=[('flinch', (0, 0, 1774, 284), (255, 284), 4), ('hurt', (0, 285, 1774, 587), (556, 587), 6), ('prone', (0, 588, 1774, 866), (829, 866), 2)]),
  'H3P1': dict(file='ART-53_HEAD-3_PAGE-1.png', W=1774, text=[(15, 165, 87, 200), (11, 427, 90, 462), (3, 689, 133, 726)], blank={'burrow': 1},
               rows=[('idle', (0, 0, 1774, 275), (248, 275), 6), ('walk', (0, 276, 1774, 552), (525, 552), 8), ('burrow', (0, 553, 1774, 839), (812, 839), 6)]),
  'H3P2': dict(file='ART-53_HEAD-3_PAGE-2.png', W=1774, own_strip=['spray'], xs={'spray': [248, 516, 792, 1060, 1335, 1609]},     # (Acid Spray's 4 and 5 sit low, among the jet: each digit boxed)
               text=[(14, 158, 109, 193), (14, 428, 87, 462), (7, 705, 149, 745), (238, 824, 258, 852), (506, 824, 527, 852), (782, 825, 803, 852),
                     (1599, 825, 1620, 852), (1325, 839, 1345, 867), (1049, 851, 1071, 879)],
               rows=[('reveal', (0, 0, 1774, 287), (260, 287), 6), ('attack', (0, 288, 1774, 551), (521, 551), 6), ('spray', (0, 552, 1774, 880), (825, 880), 6)]),
  'H3P3': dict(file='ART-53_HEAD-3_PAGE-3.png', W=1774, text=[(18, 160, 137, 198), (21, 438, 98, 476), (18, 719, 127, 756)],
               rows=[('flinch', (0, 0, 1774, 282), (254, 282), 4), ('hurt', (0, 283, 1774, 582), (549, 582), 6), ('prone', (0, 583, 1774, 867), (839, 867), 2)]),
  'H4P1': dict(file='ART-53_HEAD-4_PAGE-1.png', W=1881, text=[(18, 166, 92, 202), (12, 393, 94, 429), (6, 638, 121, 673)], blank={'burrow': 1},
               rows=[('idle', (0, 0, 1881, 269), (238, 269), 6), ('walk', (0, 270, 1881, 503), (473, 503), 8), ('burrow', (0, 504, 1881, 779), (748, 779), 6)]),
  'H4P2': dict(file='ART-53_HEAD-4_PAGE-2.png', W=1882, xs={'spray': [246, 533, 822, 1170, 1454, 1729]}, text=[(13, 167, 108, 200), (13, 399, 86, 433), (13, 623, 114, 695)],
               rows=[('reveal', (0, 0, 1882, 293), (250, 293), 6), ('attack', (0, 294, 1882, 520), (487, 520), 6), ('spray', (0, 521, 1882, 764), (730, 764), 6)]),
  'H4P3': dict(file='ART-53_HEAD-4_PAGE-3.png', W=1774, text=[(19, 158, 135, 198), (19, 420, 92, 460), (19, 695, 170, 744)],
               rows=[('flinch', (0, 0, 1774, 286), (257, 286), 4), ('hurt', (0, 287, 1774, 562), (531, 562), 6), ('prone', (0, 563, 1774, 837), (808, 837), 2)]),
  'H5P1': dict(file='ART-53_HEAD-5_PAGE-1.png', W=1774, text=[(24, 133, 103, 170), (12, 417, 97, 454), (9, 692, 130, 733)], blank={'burrow': 1},
               rows=[('idle', (0, 0, 1774, 283), (253, 283), 6), ('walk', (0, 284, 1774, 566), (536, 566), 8), ('burrow', (0, 567, 1774, 846), (817, 846), 6)]),
  'H5P2': dict(file='ART-53_HEAD-5_PAGE-2.png', W=1774, xs={'spray': [222, 486, 776, 1056, 1340, 1628]}, text=[(14, 161, 137, 202), (14, 453, 107, 495), (14, 685, 133, 774)],
               rows=[('reveal', (0, 0, 1774, 318), (289, 318), 6), ('attack', (0, 319, 1774, 600), (571, 600), 6), ('spray', (0, 601, 1774, 878), (850, 878), 6)]),
  'H5P3': dict(file='ART-53_HEAD-5_PAGE-3.png', W=1774, text=[(18, 140, 139, 177), (18, 429, 92, 466), (18, 701, 127, 738)],
               rows=[('flinch', (0, 0, 1774, 280), (250, 280), 4), ('hurt', (0, 281, 1774, 571), (541, 571), 6), ('prone', (0, 572, 1774, 858), (829, 858), 2)]),
}
# every row's numbers by hand (the digits read as islands in the navy): the acid jets, the kicking legs and the antennae cross the strips
XS = {'H1P1': {'idle': [224, 475, 736, 995, 1256, 1533], 'walk': [195, 403, 613, 816, 1027, 1234, 1447, 1650], 'burrow': [236, 537, 826, 1110, 1387, 1645]},
      'H1P2': {'reveal': [268, 521, 790, 1064, 1339, 1610], 'attack': [268, 518, 790, 1063, 1338, 1610]},
      'H1P3': {'flinch': [317, 614, 916, 1211], 'hurt': [262, 529, 784, 1077, 1360, 1629], 'prone': [316, 628]},
      'H2P1': {'idle': [238, 510, 778, 1051, 1324, 1602], 'walk': [216, 402, 608, 800, 1009, 1216, 1424, 1632], 'burrow': [242, 542, 808, 1082, 1356, 1628]},
      'H2P2': {'reveal': [240, 510, 776, 1048, 1336, 1606], 'attack': [220, 484, 742, 1030, 1318, 1608]},
      'H2P3': {'flinch': [347, 722, 1061, 1379], 'hurt': [238, 508, 798, 1056, 1338, 1622], 'prone': [344, 638]},
      'H3P1': {'idle': [224, 510, 774, 1040, 1322, 1590], 'walk': [186, 398, 600, 806, 1016, 1218, 1434, 1640], 'burrow': [232, 528, 806, 1088, 1372, 1638]},
      'H3P2': {'reveal': [238, 506, 769, 1049, 1332, 1608], 'attack': [237, 508, 769, 1050, 1336, 1608]},
      'H3P3': {'flinch': [303, 668, 1027, 1363], 'hurt': [233, 496, 772, 1045, 1324, 1612], 'prone': [302, 619]},
      'H4P1': {'idle': [238, 532, 821, 1112, 1406, 1694], 'walk': [194, 425, 640, 862, 1081, 1300, 1528, 1753], 'burrow': [242, 549, 861, 1161, 1449, 1723]},
      'H4P2': {'reveal': [254, 534, 848, 1145, 1441, 1727], 'attack': [236, 541, 878, 1168, 1442, 1725]},
      'H4P3': {'flinch': [310, 700, 1069, 1450], 'hurt': [238, 494, 747, 1022, 1314, 1584], 'prone': [285, 630]},
      'H5P1': {'idle': [258, 534, 814, 1088, 1360, 1624], 'walk': [196, 404, 610, 820, 1034, 1246, 1456, 1658], 'burrow': [256, 534, 812, 1088, 1376, 1658]},
      'H5P2': {'reveal': [236, 486, 777, 1056, 1346, 1628], 'attack': [218, 486, 777, 1056, 1346, 1628]},
      'H5P3': {'flinch': [288, 560, 824, 1074], 'hurt': [216, 480, 760, 1030, 1324, 1608], 'prone': [258, 525]}}
for _L, _x in XS.items():
    PAGES[_L]['xs'] = dict(PAGES[_L].get('xs', {}), **_x)
VIEWS = {'SE': ('H1P1', 'H1P2', 'H1P3'), 'NE': ('H2P1', 'H2P2', 'H2P3'), 'S': ('H3P1', 'H3P2', 'H3P3'), 'E': ('H4P1', 'H4P2', 'H4P3'),
         'N': ('H5P1', 'H5P2', 'H5P3')}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'burrow', 'reveal', 'prone']     # (spray: cut and checked to fit, not laid -- the head says why)
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'burrow': 8, 'reveal': 8, 'prone': 6}


def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the antennae above and the legs below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 30 // 100: top + (bot - top) * 70 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build():
    h = {'side': STAND, 'S': STAND, 'N': STAND}
    st = {L: ('attack', 0) for L in PAGES if L.endswith('P2')}         # (page 2 opens on the Burst, low in the ground: its Bite 1 stands)
    first = AD.views(ROOT, 'ankheg', 'ART-53', PAGES, VIEWS, h, fit, torso_x, (FW, FH, AX, AY), stand_of=st)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'ankheg', 'ART-53', PAGES, VIEWS, h, fit, torso_x, (FW, FH, AX, AY), tone_ref=ref, stand_of=st)
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
    meta['source'] = ('drawn by the art desk (ART-10 SE and NE, 10-10; ART-53 S, E and N, 10-19), cut by tools/ankheg-sheet.py '
                      'through tools/artdesk.py (10-22)')
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
