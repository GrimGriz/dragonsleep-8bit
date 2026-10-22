"""DEEP16 pipeline 2 (generated art): the art desk's manticore pages -> manticore_p1, a creature new to the grid (10-22, the monster cutter
seat's third run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all tueday").

    python tools/manticore-sheet.py            # deep16/art/manticore_p1.png + .json

Sources (the art desk's, in the main checkout's deep16/_src/manticore/ -- a worktree reads them there): ART-12 (10-10), HEAD 1 SE and HEAD 2
NE on three pages each, HEAD 1's first with a portrait and a turnaround above its rows (not cut; the turnaround measured once for the heights
below); ART-55 (10-20, sorted out of Fresh by _src/art-desk/sort-delivery.py), HEAD 3 S, HEAD 4 E and HEAD 5 N on nine pages each, one action
a page, most on two lines (Fly on four): Idle 6, Walk 8, Fly 8, Bite 6, Claws 6, Tail Volley 6, Flinch 4, Fall 6, Prone 2. E's Walk is the
art desk's OPEN page (ART-55-manticore-E-WALK-OPEN.zip, its last attempt: "Near foreleg still lacks convincing rearward sweep4-6"), the only
E walk there is -- the seat's call, his to overrule (the lane's §36).
What each became: idle, walk, attack <- Bite (the bite plays `attack`: no row by its name), claw <- Claws (both claws of the Multiattack),
tailspike <- Tail Volley (its three spikes leave at frame 4, as drawn), flinch, hurt <- Fall (played once), prone <- Prone played backwards.
Fly is NOT cut: no rule on the grid plays a fly row in a fight (a flier aloft plays its idle and walk; the cloaker's fly row is its cutscene's)
-- its pages' boxes are kept in FLY below for the day one does. Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE.
Cut, scaled and placed by tools/artdesk.py. Its size (the seat's call): 58 px side-on and from the front, 62 from behind, by the art desk's
turnaround (front 209 and three-quarter 211 px, back 228, one page) -- a Large lion with its wings, a head over the winter wolf's 52. A later page
by its first frame against its view's Idle 1, a Fall page by its Fall 1, a Prone page by its Prone 1 against its own view's Fall 6. Two
passes: the second tones every page per channel to its own view's first-pass idle, and the SE and NE (ART-12) to the E's (ART-55).
The pages' boxes read by the seat's probes: ART-12's numbers are white islands under each drawing, its row names at the left; ART-55 labels
each drawing under it ("Bite, 1"), so each label's middle is its frame's x and the label strip is blanked whole.
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

NAME = 'manticore_p1'
FW, FH, AX, AY = 160, 102, 80, 90          # (the tail volley's spikes 78 px out, NE's rearing claw 87 up)
STAND = {'side': 58, 'S': 58, 'N': 62}
PRONE_FALL6 = 1.07

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> the band and strip as artdesk wants them, the strip opened 3 px up and 2 down
    (a label's top sits on the strip's edge), and its numbers by hand"""
    return [(r, b, (s[0] - 3, s[1] + 2), n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

P12 = dict(dir='')                                       # (ART-12's pages lie in _src/manticore/ itself)
SPEC = {
  'H1P1': (dict(P12, file='ART-12_HEAD-1_PAGE-1.png', W=1774, text=[(20, 470, 104, 510), (16, 711, 99, 743), (270, 318, 480, 370)]),
           R(('idle', (0, 356, 1774, 597), (570, 594), 6, [254, 526, 797, 1066, 1336, 1610]),
             ('walk', (0, 598, 1774, 848), (820, 845), 8, [212, 412, 626, 824, 1027, 1228, 1434, 1642]))),
  'H1P2': (dict(P12, file='ART-12_HEAD-1_PAGE-2.png', W=1774, text=[(21, 196, 74, 233), (22, 436, 86, 467), (21, 712, 113, 742)]),
           R(('attack', (0, 300, 1774, 543), (513, 540), 6, [226, 494, 760, 1012, 1270, 1526]),
             ('claw', (0, 544, 1774, 825), (798, 822), 6, [220, 490, 752, 1036, 1316, 1566]))),
  'H1P3': (dict(P12, file='ART-12_HEAD-1_PAGE-3.png', W=1774,
                text=[(21, 110, 74, 141), (70, 110, 86, 141), (20, 146, 122, 183), (21, 348, 103, 379), (98, 348, 123, 379), (22, 545, 85, 575), (22, 737, 117, 767)]),
           R(('tailspike', (0, 0, 1774, 245), (214, 242), 6, [240, 506, 752, 988, 1362, 1648]),
             ('flinch', (0, 246, 1774, 463), (435, 460), 4, [314, 592, 866, 1142]),
             ('hurt', (0, 464, 1774, 667), (636, 664), 6, [243, 494, 768, 1028, 1326, 1626]),
             ('prone', (0, 668, 1774, 850), (824, 847), 2, [308, 598]))),
  'H2P1': (dict(P12, file='ART-12_HEAD-2_PAGE-1.png', W=1774, text=[(25, 239, 92, 271), (16, 606, 99, 637)]),
           R(('idle', (0, 0, 1774, 383), (357, 380), 6, [260, 544, 808, 1070, 1336, 1616]),
             ('walk', (0, 384, 1774, 771), (744, 768), 8, [190, 386, 590, 794, 1000, 1207, 1422, 1630]))),
  'H2P2': (dict(P12, file='ART-12_HEAD-2_PAGE-2.png', W=1774, text=[(16, 140, 72, 180), (19, 417, 90, 449), (14, 641, 111, 673)]),
           R(('attack', (0, 295, 1774, 547), (520, 544), 6, [232, 503, 771, 1042, 1318, 1600]),
             ('claw', (0, 548, 1774, 837), (810, 834), 6, [220, 488, 751, 1016, 1288, 1576]))),
  'H2P3': (dict(P12, file='ART-12_HEAD-2_PAGE-3.png', W=1536,
                text=[(19, 153, 165, 188), (110, 153, 134, 182), (18, 390, 116, 424), (18, 620, 85, 657), (19, 857, 100, 886),
                      (312, 312, 336, 334), (166, 324, 198, 360), (471, 381, 493, 414), (582, 304, 612, 329), (676, 322, 704, 351),     # (the motion marks
                      (339, 570, 361, 593), (121, 599, 144, 637), (339, 639, 349, 655), (356, 635, 369, 655)]),
           R(('tailspike', (0, 0, 1536, 282), (259, 279), 6, [254, 480, 700, 920, 1160, 1390]),
             ('flinch', (0, 283, 1536, 527), (504, 524), 4, [288, 564, 802, 1043]),
             ('hurt', (0, 528, 1536, 754), (731, 751), 6, [214, 432, 684, 906, 1138, 1382]),
             ('prone', (0, 755, 1536, 985), (962, 982), 2, [250, 565]))),
  # ART-55: one action a page, most on two lines (the second line's row `<row>_b`, joined onto the first)
  'H3P1': (dict(file='ART-55_HEAD-3_PAGE-1.png', W=1536, text=[]),
           R(('idle', (0, 0, 1536, 458), (422, 455), 3, [318, 768, 1238]), ('idle_b', (0, 459, 1536, 896), (860, 893), 3, [316, 768, 1225]))),
  'H3P2': (dict(file='ART-55_HEAD-3_PAGE-2.png', W=1774, text=[(32, 258, 140, 296), (32, 658, 140, 696)]),
           R(('walk', (0, 0, 1774, 414), (380, 411), 4, [336, 740, 1159, 1567]), ('walk_b', (0, 415, 1774, 826), (791, 823), 4, [330, 728, 1158, 1573]))),
  'H3P4': (dict(file='ART-55_HEAD-3_PAGE-4.png', W=1774, text=[]),
           R(('attack', (0, 0, 1774, 411), (373, 408), 3, [349, 902, 1460]), ('attack_b', (0, 412, 1774, 823), (783, 820), 3, [350, 899, 1460]))),
  'H3P5': (dict(file='ART-55_HEAD-3_PAGE-5.png', W=1536, text=[]),
           R(('claw', (0, 0, 1536, 454), (427, 451), 3, [315, 783, 1276]), ('claw_b', (0, 455, 1536, 897), (870, 894), 3, [314, 783, 1279]))),
  'H3P6': (dict(file='ART-55_HEAD-3_PAGE-6.png', W=1774, text=[]),
           R(('tailspike', (0, 0, 1774, 398), (363, 395), 3, [376, 884, 1404]), ('tailspike_b', (0, 399, 1774, 849), (813, 846), 3, [377, 884, 1405]))),
  'H3P7': (dict(file='ART-55_HEAD-3_PAGE-7.png', W=1774, text=[(26, 272, 120, 307), (116, 272, 143, 307)]),
           R(('flinch', (0, 0, 1774, 400), (365, 397), 4, [384, 770, 1153, 1567]))),
  'H3P8': (dict(file='ART-55_HEAD-3_PAGE-8.png', W=1536, text=[]),
           R(('hurt', (0, 0, 1536, 472), (441, 469), 3, [256, 751, 1252]), ('hurt_b', (0, 473, 1536, 928), (897, 925), 3, [256, 768, 1251]))),
  'H3P9': (dict(file='ART-55_HEAD-3_PAGE-9.png', W=1774, text=[]), R(('prone', (0, 0, 1774, 715), (672, 712), 2, [508, 1308]))),
  'H4P1': (dict(file='ART-55_HEAD-4_PAGE-1.png', W=1774, text=[]),
           R(('idle', (0, 0, 1774, 392), (364, 389), 3, [316, 909, 1489]), ('idle_b', (0, 393, 1774, 792), (764, 789), 3, [319, 908, 1489]))),
  'H4P2': (dict(file='ART-55_HEAD-4_PAGE-2.png', W=1774, text=[]),
           R(('walk', (0, 0, 1774, 427), (402, 424), 4, [245, 682, 1116, 1562]), ('walk_b', (0, 428, 1774, 791), (766, 788), 4, [245, 684, 1115, 1556]))),
  'H4P4': (dict(file='ART-55_HEAD-4_PAGE-4.png', W=1774, text=[]),
           R(('attack', (0, 0, 1774, 392), (364, 389), 3, [296, 885, 1482]), ('attack_b', (0, 393, 1774, 793), (764, 790), 3, [301, 885, 1482]))),
  'H4P5': (dict(file='ART-55_HEAD-4_PAGE-5.png', W=1774, text=[(25, 274, 122, 307)]),
           R(('claw', (0, 0, 1774, 410), (379, 407), 3, [373, 920, 1471]), ('claw_b', (0, 411, 1774, 807), (777, 804), 3, [330, 920, 1475]))),
  'H4P6': (dict(file='ART-55_HEAD-4_PAGE-6.png', W=1774, text=[]),
           R(('tailspike', (0, 0, 1774, 422), (388, 419), 3, [316, 886, 1466]), ('tailspike_b', (0, 423, 1774, 811), (777, 808), 3, [289, 887, 1518]))),
  'H4P7': (dict(file='ART-55_HEAD-4_PAGE-7.png', W=2172, text=[(26, 396, 141, 437), (138, 396, 170, 437)]),
           R(('flinch', (0, 0, 2172, 560), (518, 557), 4, [410, 893, 1398, 1894]))),
  'H4P8': (dict(file='ART-55_HEAD-4_PAGE-8.png', W=1774, text=[]),
           R(('hurt', (0, 0, 1774, 423), (388, 420), 3, [310, 888, 1445]), ('hurt_b', (0, 424, 1774, 785), (754, 782), 3, [317, 902, 1488]))),
  'H4P9': (dict(file='ART-55_HEAD-4_PAGE-9.png', W=1774, text=[]), R(('prone', (0, 0, 1774, 644), (609, 641), 2, [474, 1360]))),
  'H5P1': (dict(file='ART-55_HEAD-5_PAGE-1.png', W=1774, text=[]),
           R(('idle', (0, 0, 1774, 395), (357, 392), 3, [428, 896, 1368]), ('idle_b', (0, 396, 1774, 814), (785, 811), 3, [428, 897, 1366]))),
  'H5P2': (dict(file='ART-55_HEAD-5_PAGE-2.png', W=1774, text=[]),
           R(('walk', (0, 0, 1774, 399), (371, 396), 4, [313, 721, 1114, 1505]), ('walk_b', (0, 400, 1774, 810), (782, 807), 4, [315, 719, 1111, 1506]))),
  'H5P4': (dict(file='ART-55_HEAD-5_PAGE-4.png', W=2172, text=[]),
           R(('attack', (0, 0, 2172, 476), (444, 473), 6, [196, 554, 904, 1267, 1619, 1976]))),
  'H5P5': (dict(file='ART-55_HEAD-5_PAGE-5.png', W=1774, text=[]),
           R(('claw', (0, 0, 1774, 387), (361, 384), 3, [438, 910, 1367]), ('claw_b', (0, 388, 1774, 819), (788, 816), 3, [438, 904, 1354]))),
  'H5P6': (dict(file='ART-55_HEAD-5_PAGE-6.png', W=1774, text=[]),
           R(('tailspike', (0, 0, 1774, 405), (374, 402), 3, [366, 888, 1405]), ('tailspike_b', (0, 406, 1774, 845), (814, 842), 3, [367, 888, 1405]))),
  'H5P7': (dict(file='ART-55_HEAD-5_PAGE-7.png', W=2172, text=[]),
           R(('flinch', (0, 0, 2172, 623), (589, 620), 4, [285, 808, 1350, 1885]))),
  'H5P8': (dict(file='ART-55_HEAD-5_PAGE-8.png', W=1774, text=[]),
           R(('hurt', (0, 0, 1774, 413), (387, 410), 3, [432, 887, 1345]), ('hurt_b', (0, 414, 1774, 826), (798, 823), 3, [429, 885, 1345]))),
  'H5P9': (dict(file='ART-55_HEAD-5_PAGE-9.png', W=1774, text=[]), R(('prone', (0, 0, 1774, 667), (630, 664), 2, [521, 1251]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC.items()}
# the Fly pages, read and not cut (no rule plays a fly row in a fight yet): ART-12 each P2's first band, 8; ART-55 each P3, four lines of two
FLY = {'H1P2': ((0, 0, 1774, 299), (269, 296), [188, 414, 634, 853, 1070, 1276, 1478, 1668]),
       'H2P2': ((0, 0, 1774, 294), (267, 291), [166, 389, 596, 792, 999, 1216, 1433, 1642]),
       'H3P3': [((0, 0, 1536, 280), (252, 277), [460, 1046]), ((0, 281, 1536, 518), (488, 515), [461, 1062]), ((0, 519, 1536, 755), (726, 752), [460, 1069]), ((0, 756, 1536, 992), (964, 989), [458, 1071])],
       'H4P3': [((0, 0, 1536, 277), (249, 274), [504, 1068]), ((0, 278, 1536, 501), (474, 498), [489, 1072]), ((0, 502, 1536, 745), (709, 742), [483, 1072]), ((0, 746, 1536, 988), (960, 985), [488, 1072])],
       'H5P3': [((0, 0, 1536, 282), (255, 279), [440, 1082]), ((0, 283, 1536, 506), (479, 503), [440, 1081]), ((0, 507, 1536, 738), (711, 735), [441, 1082]), ((0, 739, 1536, 985), (958, 982), [441, 1081])]}
# each volley's three spikes to frame 4, where the art desk lets them go (a spike is a core of its own, seeded by its x: the next number was
# nearer); E's claw streaks to the swipe they trail
FIX = {'H1P3': {'tailspike': [((1100, 100, 1240, 210), '4')]}, 'H2P3': {'tailspike': [((1050, 25, 1110, 68), '4')]},
       'H4P5': {'claw_b': [((550, 555, 625, 692), '1')]}}
CUTS = {}
VIEWS = {'SE': ('H1P1', 'H1P2', 'H1P3'), 'NE': ('H2P1', 'H2P2', 'H2P3'),
         'S': tuple('H3P%d' % i for i in (1, 2, 4, 5, 6, 7, 8, 9)), 'E': tuple('H4P%d' % i for i in (1, 2, 4, 5, 6, 7, 8, 9)),
         'N': tuple('H5P%d' % i for i in (1, 2, 4, 5, 6, 7, 8, 9))}
JOINS = {r + '_b': r for r in ('idle', 'walk', 'attack', 'claw', 'tailspike', 'hurt')}
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'claw', 'prone', 'tailspike']
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'flinch': 10, 'claw': 10, 'prone': 6, 'tailspike': 10}


def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the wings' tips above and the legs below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 40 // 100: top + (bot - top) * 80 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def measure(im):
    """a page frame's height for its page's scale: its biggest piece once the thin parts are opened away (radius 12 page px) -- the tail goes,
    so its spike ball, raised over the wings in some first frames (S's Walk 1 and Fall 1), drops out; the wings and legs are thicker"""
    m = np.asarray(im)[..., 3] > 0
    yy, xx = np.mgrid[-12:13, -12:13]
    o = ndimage.binary_opening(m, structure=(xx * xx + yy * yy) <= 144)
    lab, n = ndimage.label(o, structure=np.ones((3, 3)))
    if not n:
        return AD.body_h(im)
    big = lab == 1 + int(np.argmax(ndimage.sum(o, lab, range(1, n + 1))))
    ys = np.where(big.any(axis=1))[0]
    return float(ys[-1] - ys[0] + 1)


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def prone_targets():
    """each ART-55 Prone page: its Prone 1 at PRONE_FALL6 of its own view's Fall 6, at game size (the Fall page scaled as artdesk does);
    and NE's third page by SE's (below)"""
    cuts = AD.cut(ROOT, 'manticore', 'ART-55', PAGES, fix=FIX, cuts=CUTS)
    K = AD.scales(cuts, VIEWS, STAND, fit, measure=measure)
    out = {}
    for fall, prone in (('H3P8', 'H3P9'), ('H4P8', 'H4P9'), ('H5P8', 'H5P9')):
        f6, p1 = cuts[fall]['hurt_b'][2][0], cuts[prone]['prone'][0][0]
        if prone == 'H4P9':                            # (side-on: by `measure`, the ball left out)
            kp = measure(p1) * K[fall] / (PRONE_FALL6 * measure(f6))
        else:                                          # (from the front and behind, by the width: lying, the wings spread alike in both, and the
            kp = p1.size[0] * K[fall] / f6.size[0]     #  ball rides high on S's Fall 6 -- by height its Prone stood a third over its idle)
        out[prone] = ('prone', 0, AD.tall(fit(p1, kp)))
    # NE's third page (its Tail Volley, Flinch, Fall, Prone) by SE's: the two three-quarter views stand alike, and NE's Fall 1 against its
    # Idle 1 (wings spread on the one page, lower on the other) set it a seventh bigger than SE's (the seat's call, the lane's §36)
    out['H2P3'] = ('hurt', 0, AD.tall(fit(cuts['H1P3']['hurt'][0][0], K['H1P3'])))
    print('  targets: ' + ', '.join('%s %d' % (L, t[2]) for L, t in out.items()))
    return out


def build():
    tg = prone_targets()
    cell = (FW, FH, AX, AY)
    kw = dict(fix=FIX, cuts=CUTS, targets=tg, joins=JOINS, measure=measure)
    first = AD.views(ROOT, 'manticore', 'ART-55', PAGES, VIEWS, STAND, fit, torso_x, cell, **kw)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'manticore', 'ART-55', PAGES, VIEWS, STAND, fit, torso_x, cell, tone_ref=ref, **kw)
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
    meta['source'] = ('drawn by the art desk (ART-12 SE and NE, 10-10; ART-55 S, E and N, 10-20 -- E Walk its OPEN page), cut by '
                      'tools/manticore-sheet.py through tools/artdesk.py (10-22)')
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
