"""DEEP16 pipeline 2 (generated art): the art desk's rust monster pages -> rustmonster_p1, a creature new to the grid (10-22, the monster
cutter seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all tueday").

    python tools/rustmonster-sheet.py            # deep16/art/rustmonster_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/rustmonster/ -- a worktree reads them there): ART-16 (10-10), HEAD 1 SE and HEAD 2
NE on two pages each -- SE's first page the revised "Rustmonster front-facing animation sheet.png" (the art desk's log: the zip still held
the old one), with a portrait and a turnaround above its rows (not cut; the turnaround measured once for the heights below); ART-57 (10-20,
sorted out of Fresh by _src/art-desk/sort-delivery.py), HEAD 3 S, HEAD 4 E and HEAD 5 N on eight pages each, one action a page: Idle 6,
Walk 8, Antennae 6, Bite 6, Gobble 6, Flinch 4, Fall 6, Prone 2 (E's every page leans three-quarter, by the art desk's own note).
What each became: idle, walk, attack <- Bite, flinch, hurt <- Fall (played once), prone <- Prone played backwards (belly up at the last, it
rights itself by playing it back). Antennae and Gobble are NOT cut: the grid has no Antennae action (its armour rust rides the bite, the gray
ooze's way -- data/foes.js rustmonster) and no dropped weapon to gobble; their boxes are kept in UNCUT below. Facings: the five views as drawn,
SW, W and NW the mirrors of SE, E and NE.
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 36 px side-on (a dog-sized armoured bug, its antennae up), 39 from the
front and 36 from behind, by the art desk's turnaround (front 167, sides 153 and 155, back 154 px, one page). A later page by its first frame
against its view's Idle 1, a Fall page by its Fall 1, an ART-57 Prone page by its Prone 2 (upright, by the art desk's note). Two passes: the second tones every page per channel to its own view's first-pass idle, and the SE
and NE (ART-16) to the E's (ART-57).
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

NAME = 'rustmonster_p1'
FW, FH, AX, AY = 108, 56, 54, 50            # (SE's bite reaches 51 px, NE's antennae 46 up)
STAND = {'side': 36, 'S': 39, 'N': 36}

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows (the strip opened 2 px each way) and the numbers by hand"""
    return [(r, b, (s[0] - 2, s[1] + 2), n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

P16 = dict(dir='', W=1774)                               # (ART-16's pages lie in _src/rustmonster/ itself)
SPEC = {
  'H1P1': (dict(P16, file='Rustmonster front-facing animation sheet.png', text=[(19, 385, 88, 416), (18, 568, 94, 598), (14, 750, 148, 779)]),
           R(('idle', (0, 295, 1774, 483), (462, 480), 6, [239, 517, 787, 1064, 1335, 1606]),
             ('walk', (0, 484, 1774, 666), (645, 663), 8, [217, 417, 609, 811, 1025, 1217, 1427, 1630]))),
  'H1P2': (dict(P16, file='ART-16_HEAD-1_PAGE-2.png', text=[(5, 70, 105, 120), (5, 415, 120, 465), (5, 580, 95, 630), (5, 752, 110, 804),
                                                                  (625, 380, 680, 430), (334, 704, 365, 736), (185, 720, 214, 755), (362, 818, 391, 849)]),
           R(('attack', (0, 0, 1774, 179), (157, 176), 6, [248, 545, 838, 1108, 1388, 1645]),     # (its 5th by the page: the probe lost it in the jaw)
             ('flinch', (0, 353, 1774, 527), (506, 524), 4, [252, 545, 838, 1134]),            # (its 3rd likewise)
             ('hurt', (0, 528, 1774, 691), (669, 688), 6, [243, 518, 758, 1041, 1315, 1623]),
             ('prone', (0, 692, 1774, 875), (848, 866), 2, [242, 605]))),                       # (Prone 1's yellow marks kept, with it)
  'H2P1': (dict(P16, file='ART-16_HEAD-2_PAGE-1.png', text=[(18, 150, 100, 210), (12, 410, 100, 456), (14, 696, 155, 741)]),
           R(('idle', (0, 0, 1774, 279), (258, 276), 6, [239, 508, 774, 1045, 1311, 1575]),
             ('walk', (0, 280, 1774, 539), (517, 536), 8, [204, 405, 604, 803, 1021, 1225, 1428, 1644]))),
  'H2P2': (dict(P16, file='ART-16_HEAD-2_PAGE-2.png', text=[(16, 96, 95, 140), (18, 442, 120, 487), (18, 611, 80, 656), (16, 772, 118, 812)]),
           R(('attack', (0, 0, 1774, 198), (177, 195), 6, [224, 489, 753, 1023, 1277, 1567]),
             ('flinch', (0, 377, 1774, 548), (527, 545), 4, [226, 522, 796, 1083]),
             ('hurt', (0, 549, 1774, 713), (692, 710), 6, [228, 492, 756, 1023, 1283, 1569]),
             ('prone', (0, 714, 1774, 876), (855, 873), 2, [230, 510]))),
  # ART-57: one action a page (2172 x 724, some 1774 x 887); E's missing digits from the bodies' middles (the probe lost them: thin and soft)
  'H3P1': (dict(file='ART-57_HEAD-3_PAGE-1.png', W=2172, text=[(27, 392, 126, 431)]), R(('idle', (0, 0, 2172, 553), (523, 550), 6, [293, 625, 957, 1294, 1630, 1968]))),
  'H3P2': (dict(file='ART-57_HEAD-3_PAGE-2.png', W=2172, text=[(21, 383, 118, 420)]), R(('walk', (0, 0, 2172, 521), (493, 518), 8, [258, 510, 760, 1014, 1264, 1515, 1768, 2022]))),
  'H3P4': (dict(file='ART-57_HEAD-3_PAGE-4.png', W=2172, text=[(24, 342, 109, 380)]), R(('attack', (0, 0, 2172, 551), (519, 548), 6, [250, 606, 940, 1282, 1628, 1984]))),
  'H3P6': (dict(file='ART-57_HEAD-3_PAGE-6.png', W=2172, text=[(34, 355, 200, 403)]), R(('flinch', (0, 0, 2172, 603), (564, 600), 4, [406, 895, 1393, 1902]))),
  'H3P7': (dict(file='ART-57_HEAD-3_PAGE-7.png', W=2172, text=[(28, 361, 121, 402)]), R(('hurt', (0, 0, 2172, 578), (544, 575), 6, [281, 606, 925, 1242, 1569, 1935]))),
  'H3P8': (dict(file='ART-57_HEAD-3_PAGE-8.png', W=1774, text=[(26, 405, 179, 452)]), R(('prone', (0, 0, 1774, 732), (695, 729), 2, [597, 1277]))),
  'H4P1': (dict(file='ART-57_HEAD-4_PAGE-1.png', W=2172, text=[(19, 346, 104, 383)]), R(('idle', (0, 0, 2172, 486), (457, 483), 6, [292, 629, 977, 1314, 1657, 1980]))),
  'H4P2': (dict(file='ART-57_HEAD-4_PAGE-2.png', W=2164, text=[(28, 338, 124, 373)]), R(('walk', (0, 0, 2164, 460), (433, 457), 8, [254, 508, 759, 1001, 1260, 1510, 1758, 2006]))),
  'H4P4': (dict(file='ART-57_HEAD-4_PAGE-4.png', W=2172, text=[(27, 357, 106, 392)]), R(('attack', (0, 0, 2172, 488), (460, 485), 6, [317, 633, 956, 1300, 1638, 1974]))),
  'H4P6': (dict(file='ART-57_HEAD-4_PAGE-6.png', W=2172, text=[(28, 364, 166, 407), (465, 230, 552, 318), (940, 268, 1020, 350), (1478, 265, 1552, 345)]), R(('flinch', (0, 0, 2172, 560), (524, 557), 4, [368, 876, 1353, 1890]))),
  'H4P7': (dict(file='ART-57_HEAD-4_PAGE-7.png', W=2172, text=[(25, 339, 110, 377)]), R(('hurt', (0, 0, 2172, 484), (457, 481), 6, [312, 621, 963, 1274, 1632, 1978]))),
  'H4P8': (dict(file='ART-57_HEAD-4_PAGE-8.png', W=1774, text=[(25, 451, 189, 499)]), R(('prone', (0, 0, 1774, 645), (608, 642), 2, [592, 1346]))),
  'H5P1': (dict(file='ART-57_HEAD-5_PAGE-1.png', W=2172, text=[(25, 373, 112, 410)]), R(('idle', (0, 0, 2172, 565), (536, 562), 6, [264, 622, 990, 1322, 1672, 2002]))),
  'H5P2': (dict(file='ART-57_HEAD-5_PAGE-2.png', W=2172, text=[(16, 336, 120, 374)]), R(('walk', (0, 0, 2172, 553), (521, 550), 8, [236, 493, 760, 1003, 1254, 1509, 1770, 2022]))),
  'H5P4': (dict(file='ART-57_HEAD-5_PAGE-4.png', W=2172, text=[(16, 354, 104, 392)]), R(('attack', (0, 0, 2172, 581), (549, 578), 6, [264, 594, 927, 1271, 1617, 1960]))),
  'H5P6': (dict(file='ART-57_HEAD-5_PAGE-6.png', W=1983, text=[(31, 343, 194, 388), (692, 258, 750, 306), (950, 310, 988, 362), (660, 350, 688, 408), (690, 472, 730, 520), (1222, 150, 1260, 186), (1367, 172, 1400, 210)]),
           R(('flinch', (0, 0, 1983, 602), (567, 599), 4, [383, 810, 1286, 1746]))),
  'H5P7': (dict(file='ART-57_HEAD-5_PAGE-7.png', W=2172, text=[(20, 350, 110, 395)]), R(('hurt', (0, 0, 2172, 551), (523, 548), 6, [253, 572, 901, 1236, 1595, 1983]))),
  'H5P8': (dict(file='ART-57_HEAD-5_PAGE-8.png', W=1774, text=[(38, 404, 256, 464)]), R(('prone', (0, 0, 1774, 730), (688, 727), 2, [616, 1190]))),
  # the Antennae pages, one band of six (10-28, his "Yes, cut them": js/monsterrules.js plays its own `antennae` row)
  'H3P3': (dict(file='ART-57_HEAD-3_PAGE-3.png', W=2172, text=[(15, 500, 212, 548)]), R(('antennae', (0, 0, 2172, 596), (564, 596), 6, [355, 673, 992, 1310, 1641, 1970]))),
  'H4P3': (dict(file='ART-57_HEAD-4_PAGE-3.png', W=2172, text=[(15, 350, 180, 392)]), R(('antennae', (0, 0, 2172, 477), (449, 477), 6, [325, 653, 981, 1306, 1644, 1972]))),
  'H5P3': (dict(file='ART-57_HEAD-5_PAGE-3.png', W=2172, text=[(22, 369, 231, 410)]), R(('antennae', (0, 0, 2172, 554), (523, 554), 6, [386, 708, 1027, 1352, 1679, 1996]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC.items()}
# drawn and not cut (no rule plays them): Gobble (ART-16 each P2's second; each P5); the Antennae (ART-16 each P1's third row; ART-57 each P3) cut since 10-28
UNCUT = {'H1P1 antennae': ((0, 667, 1774, 854), (832, 851), [275, 547, 819, 1095, 1368, 1619]), 'H2P1 antennae': ((0, 540, 1774, 822), (800, 819), [238, 508, 775, 1045, 1333, 1588]),
         'H1P2 gobble': ((0, 180, 1774, 352), (331, 349), None), 'H2P2 gobble': ((0, 199, 1774, 376), (355, 373), [223, 489, 753, 1023, 1282, 1568]),
         'ART-57 P5 gobble': 'one band a page, as the others'}
for _L in ('H1P1', 'H2P1'):                     # (ART-16's Antennae rows, kept in UNCUT since 10-22: cut 10-28)
    _b, _s, _x = UNCUT[_L + ' antennae']
    PAGES[_L] = dict(PAGES[_L], rows=PAGES[_L]['rows'] + [('antennae', _b, _s, 6)], xs=dict(PAGES[_L]['xs'], antennae=_x))
# the reaction marks the art desk left to the cutter ("removable intentionally or grouped as effects"): out, as the manticore's -- SE's yellow
# ticks on Flinch 2 and Prone 1, E's and N's pale marks round Flinch 1-3 -- boxed as lettering in each page's `text` above
FIX, CUTS = {}, {}
VIEWS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'),
         'S': tuple('H3P%d' % i for i in (1, 2, 4, 6, 7, 8, 3)), 'E': tuple('H4P%d' % i for i in (1, 2, 4, 6, 7, 8, 3)), 'N': tuple('H5P%d' % i for i in (1, 2, 4, 6, 7, 8, 3))}
# each ART-57 Prone page by its Prone 2, upright (the art desk: "Prone1 is belly-up and Prone2 upright"): by Prone 1 against a Fall 6 -- ART-16's
# ratio, 1.42, its legs in the air -- S's stood a quarter over its idle
STAND_OF = {'H3P8': ('prone', 1), 'H4P8': ('prone', 1), 'H5P8': ('prone', 1)}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'prone', 'antennae']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'prone': 6, 'antennae': 10}


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
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 80 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build():
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, stand_of=STAND_OF)
    first = AD.views(ROOT, 'rustmonster', 'ART-57', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'rustmonster', 'ART-57', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
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
    meta['source'] = ('drawn by the art desk (ART-16 SE and NE, 10-10, SE page 1 the revised "Rustmonster front-facing animation sheet"; ART-57 '
                      'S, E and N, 10-20), cut by tools/rustmonster-sheet.py through tools/artdesk.py (10-22)')
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
