"""DEEP16 pipeline 2 (generated art): the art desk's townsfolk pages -> folkman_p1, folkwoman_p1, folkchild_p1, the street's people (10-27,
the monster cutter seat on Griz's "spin up a cutter for the leftovers in fresh, everything in the outbox has been sent"; skipped by the
cutter runs before on his 10-14 "the villagers are for the edifice fight I think").

    python tools/townsfolk-sheet.py            # deep16/art/folkman_p1, folkwoman_p1, folkchild_p1 (.png + .json)

Sources (the art desk's, in the main checkout's deep16/_src/townsfolk/ -- a worktree reads them there): ART-09 FINAL (10-10, in
_src/townsfolk/ itself) HEAD 1 SE and HEAD 2 NE; ART-52 REVIEW (10-18, in _src/townsfolk/ART-52/) HEAD 3 S, HEAD 4 E, HEAD 5 N. Each view
two pages: PAGE 1 the man and the woman (Idle 4, Run 8 each), PAGE 2 the child (Idle 4, Run 8). Idle -> idle, Run -> walk; each one a look
of its own (the art desk's note: "Each character is a separate look"). Facings: the five views as drawn, SW, W and NW the mirrors.
The run cycles' gait is the art desk's own OPEN (ART-09 and ART-52: "Opposite-half-stride exchange is not convincingly established"): cut as
drawn, his eye on them. ART-52 RUN REVIEW (10-27, in _src/townsfolk/ART-52/, on his "spin up a cutter for the leftovers in fresh"): a
repair of the S, E and N Run 8, one look a strip (PAGE 3 the man, 4 the woman, 5 the child); "cutter/Griz must choose before replacing", so
NEWRUN says which views take it (S and N), each strip scaled so its frames' median height is the old run's (`run_targets`).
The boxes by the seat's probe (each page's bodies clustered into its rows, each frame's x its body's middle, each row's strip its white
numbers under it; the row names boxed as text); the mask by channel (`chan` 16: the blue skirt and trousers on the navy).
Cut, scaled and placed by tools/artdesk.py. Their size (the seat's call): the man 50 from every side (the heroes stand 49 to 54, the
Silverton keepers 50: tools/sheetrows.py STANDS), the woman 47 (the art desk: "slightly shorter than man"), the child 35 (about eight). A
view's page by its Idle against the look's height (the art desk: "do not cut all pages at one scale"). Two passes: the second tones every page
per channel to its own view's first-pass idle, the others to the E's.
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

FW, FH, AX, AY = 72, 64, 36, 60
CHAN = 16
LOOKS = {'folkman_p1': ('man', 1, 50), 'folkwoman_p1': ('woman', 1, 47), 'folkchild_p1': ('child', 2, 35)}   # (sheet: its rows' prefix, its page, its height)

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC = {
  'H1P1': (dict(file='ART-09_HEAD-1_PAGE-1.png', W=1536, text=[(21, 109, 53, 141), (21, 337, 53, 368), (21, 588, 52, 620), (21, 829, 52, 859), (45, 596, 69, 620), (45, 834, 68, 859), (46, 343, 73, 367), (47, 115, 72, 141), (62, 594, 131, 620), (62, 834, 93, 859), (65, 115, 91, 141), (65, 343, 92, 368), (88, 834, 112, 858), (100, 337, 130, 369), (101, 109, 123, 141), (104, 834, 131, 859), (117, 109, 143, 141), (122, 343, 148, 368), (134, 829, 163, 859), (136, 110, 156, 141), (137, 588, 176, 620), (140, 343, 166, 368), (147, 115, 173, 141), (157, 834, 182, 859), (171, 588, 190, 620), (175, 834, 200, 859), (181, 595, 207, 620)]),
           R(('manidle', (0, 0, 1536, 232), (206, 232), 4, [299, 468, 625, 796]), ('manwalk', (0, 233, 1536, 472), (445, 472), 8, [283, 445, 612, 774, 944, 1105, 1271, 1440]), ('womanidle', (0, 473, 1536, 729), (703, 729), 4, [287, 454, 626, 796]), ('womanwalk', (0, 730, 1536, 978), (952, 978), 8, [285, 448, 616, 774, 930, 1089, 1262, 1429]))),
  'H2P1': (dict(file='ART-09_HEAD-2_PAGE-1.png', W=1536, text=[(21, 827, 52, 859), (22, 108, 53, 141), (22, 336, 54, 367), (22, 588, 52, 619), (42, 835, 68, 859), (45, 343, 71, 368), (47, 594, 68, 619), (48, 115, 72, 141), (62, 835, 93, 859), (63, 344, 91, 368), (63, 594, 94, 619), (65, 115, 91, 141), (86, 834, 112, 859), (88, 594, 112, 619), (100, 109, 123, 141), (100, 337, 128, 368), (105, 835, 131, 859), (106, 594, 131, 619), (117, 108, 143, 141), (123, 343, 148, 368), (133, 827, 163, 859), (136, 108, 157, 141), (136, 588, 157, 619), (142, 344, 166, 368), (150, 115, 172, 140), (152, 587, 177, 619), (157, 834, 182, 859), (171, 588, 191, 619), (175, 835, 201, 859), (184, 594, 207, 619)]),
           R(('manidle', (0, 0, 1536, 232), (206, 232), 4, [301, 466, 634, 806]), ('manwalk', (0, 233, 1536, 471), (446, 471), 8, [282, 443, 612, 779, 938, 1100, 1266, 1433]), ('womanidle', (0, 472, 1536, 728), (702, 728), 4, [290, 457, 628, 798]), ('womanwalk', (0, 729, 1536, 978), (952, 978), 8, [281, 445, 611, 772, 929, 1090, 1260, 1426]))),
  'H3P1': (dict(file='ART-52_HEAD-3_PAGE-1.png', W=1536, text=[(20, 336, 54, 369), (21, 108, 54, 141), (21, 588, 54, 620), (21, 827, 93, 859), (44, 343, 94, 371), (47, 115, 70, 141), (47, 594, 68, 620), (62, 115, 92, 141), (62, 592, 136, 620), (89, 827, 163, 862), (97, 336, 130, 370), (100, 108, 174, 142), (121, 343, 148, 368), (132, 587, 176, 620), (142, 343, 168, 368), (155, 834, 182, 858), (168, 587, 191, 620), (175, 834, 202, 861), (184, 594, 208, 620)]),
           R(('manidle', (0, 0, 1536, 233), (206, 233), 4, [293, 457, 619, 788]), ('manwalk', (0, 234, 1536, 478), (448, 478), 8, [286, 442, 608, 766, 938, 1107, 1270, 1435]), ('womanidle', (0, 479, 1536, 729), (701, 729), 4, [287, 451, 617, 785]), ('womanwalk', (0, 730, 1536, 978), (952, 978), 8, [284, 446, 610, 771, 936, 1099, 1265, 1426]))),
  'H4P1': (dict(file='ART-52_HEAD-4_PAGE-1.png', W=1536, text=[(21, 108, 53, 141), (21, 336, 53, 368), (21, 587, 51, 620), (21, 827, 69, 859), (45, 116, 71, 140), (45, 343, 71, 368), (46, 594, 68, 620), (62, 114, 92, 140), (62, 342, 93, 368), (62, 594, 93, 620), (62, 834, 93, 859), (86, 593, 134, 620), (88, 834, 112, 859), (100, 336, 130, 370), (102, 108, 124, 142), (106, 827, 163, 860), (118, 108, 156, 142), (122, 343, 148, 368), (136, 587, 157, 620), (143, 343, 167, 368), (146, 115, 174, 141), (147, 587, 177, 620), (156, 834, 182, 860), (171, 587, 208, 620), (175, 834, 201, 861)]),
           R(('manidle', (0, 0, 1536, 233), (206, 233), 4, [301, 466, 628, 803]), ('manwalk', (0, 234, 1536, 473), (446, 473), 8, [285, 453, 616, 781, 949, 1115, 1277, 1446]), ('womanidle', (0, 474, 1536, 729), (702, 729), 4, [286, 453, 620, 789]), ('womanwalk', (0, 730, 1536, 978), (951, 978), 8, [278, 447, 610, 772, 930, 1095, 1261, 1429]))),
  'H5P1': (dict(file='ART-52_HEAD-5_PAGE-1.png', W=1536, text=[(21, 108, 54, 141), (21, 587, 52, 619), (21, 827, 52, 859), (22, 336, 53, 367), (46, 834, 69, 858), (47, 115, 71, 141), (47, 343, 71, 367), (47, 594, 93, 619), (62, 833, 93, 859), (63, 115, 91, 141), (65, 342, 92, 367), (86, 834, 133, 861), (88, 594, 112, 620), (100, 108, 124, 141), (100, 336, 129, 369), (106, 594, 132, 619), (118, 108, 157, 141), (123, 343, 148, 368), (131, 827, 163, 859), (136, 587, 157, 619), (142, 343, 168, 367), (147, 587, 177, 620), (150, 115, 174, 141), (155, 834, 182, 858), (171, 587, 191, 620), (175, 833, 201, 859), (182, 594, 208, 619)]),
           R(('manidle', (0, 0, 1536, 233), (206, 233), 4, [301, 464, 628, 792]), ('manwalk', (0, 234, 1536, 476), (447, 476), 8, [293, 454, 616, 781, 949, 1105, 1270, 1436]), ('womanidle', (0, 477, 1536, 729), (702, 729), 4, [294, 459, 623, 790]), ('womanwalk', (0, 730, 1536, 981), (951, 981), 8, [289, 455, 617, 782, 951, 1106, 1271, 1437]))),
  'H1P2': (dict(file='ART-09_HEAD-1_PAGE-2.png', W=1536, text=[(22, 584, 81, 616), (28, 340, 84, 374), (62, 584, 77, 598), (69, 340, 82, 354), (74, 585, 92, 615), (79, 341, 98, 372), (83, 584, 112, 616), (89, 340, 121, 374), (119, 585, 146, 616), (121, 340, 148, 372), (140, 590, 186, 616), (141, 340, 197, 374)]),
           R(('childidle', (0, 0, 1536, 476), (447, 476), 4, [298, 453, 615, 781]), ('childwalk', (0, 477, 1536, 723), (695, 723), 8, [288, 443, 605, 766, 927, 1084, 1251, 1424]))),
  'H2P2': (dict(file='ART-09_HEAD-2_PAGE-2.png', W=1536, text=[(21, 584, 49, 616), (27, 340, 51, 372), (40, 583, 80, 616), (45, 340, 85, 374), (62, 584, 76, 598), (68, 340, 82, 354), (73, 585, 93, 616), (75, 340, 98, 372), (83, 584, 112, 616), (89, 339, 119, 373), (119, 585, 147, 616), (126, 340, 166, 374), (141, 590, 186, 616), (157, 339, 197, 373)]),
           R(('childidle', (0, 0, 1536, 475), (447, 475), 4, [293, 450, 612, 778]), ('childwalk', (0, 476, 1536, 728), (699, 728), 8, [290, 447, 609, 767, 926, 1088, 1255, 1415]))),
  'H3P2': (dict(file='ART-52_HEAD-3_PAGE-2.png', W=1536, text=[(26, 303, 72, 335), (26, 603, 84, 633), (64, 302, 98, 335), (68, 602, 82, 615), (69, 303, 82, 315), (79, 602, 98, 633), (89, 303, 120, 335), (92, 601, 175, 633), (127, 302, 182, 335), (168, 608, 196, 634), (175, 309, 200, 335)]),
           R(('childidle', (0, 0, 1536, 466), (436, 466), 4, [287, 458, 629, 798]), ('childwalk', (0, 467, 1536, 783), (753, 783), 8, [289, 453, 615, 779, 944, 1101, 1263, 1424]))),
  'H4P2': (dict(file='ART-52_HEAD-4_PAGE-2.png', W=1536, text=[(22, 586, 66, 618), (26, 330, 85, 363), (60, 586, 80, 618), (68, 330, 82, 344), (72, 587, 94, 618), (75, 330, 98, 363), (83, 585, 112, 619), (92, 330, 118, 363), (119, 587, 147, 619), (125, 331, 147, 363), (141, 593, 166, 619), (142, 330, 166, 363), (158, 593, 187, 619), (160, 329, 197, 363)]),
           R(('childidle', (0, 0, 1536, 473), (443, 473), 4, [287, 448, 612, 782]), ('childwalk', (0, 474, 1536, 746), (717, 746), 8, [289, 449, 611, 767, 937, 1099, 1262, 1431]))),
  'H5P2': (dict(file='ART-52_HEAD-5_PAGE-2.png', W=1536, text=[(31, 607, 56, 640), (32, 323, 79, 356), (50, 607, 89, 640), (73, 330, 91, 356), (73, 607, 124, 639), (86, 323, 124, 356), (129, 607, 157, 640), (131, 323, 173, 358), (150, 615, 177, 640), (167, 323, 204, 356), (172, 614, 197, 640)]),
           R(('childidle', (0, 0, 1536, 475), (446, 475), 4, [293, 448, 608, 774]), ('childwalk', (0, 476, 1536, 762), (734, 762), 8, [292, 455, 614, 776, 937, 1096, 1264, 1434]))),
  # the art desk's run strips of 10-27 (ART-52 RUN REVIEW): one look's Run 8 a page, PAGE 3 the man, 4 the woman, 5 the child
  'H3P3': (dict(file='ART-52_HEAD-3_PAGE-3_Man-Run8_REVIEW.png', W=2172, text=[(23, 320, 219, 362)]),
           R(('manrun', (0, 0, 2172, 560), (523, 560), 8, [350, 575, 812, 1048, 1275, 1514, 1753, 1990]))),
  'H3P4': (dict(file='ART-52_HEAD-3_PAGE-4_Woman-Run8_REVIEW.png', W=1881, text=[]),
           R(('womanrun', (0, 0, 1881, 723), (615, 723), 8, [143, 378, 606, 836, 1063, 1291, 1516, 1746]))),
  'H3P5': (dict(file='ART-52_HEAD-3_PAGE-5_Child-Run8_REVIEW.png', W=2172, text=[(22, 355, 253, 396)]),
           R(('childrun', (0, 0, 2172, 562), (525, 562), 8, [369, 602, 830, 1065, 1304, 1538, 1777, 2020]))),
  'H4P3': (dict(file='ART-52_HEAD-4_PAGE-3_Man-Run8_REVIEW.png', W=2172, text=[(26, 331, 216, 371)]),
           R(('manrun', (0, 0, 2172, 548), (510, 548), 8, [348, 571, 798, 1055, 1306, 1546, 1782, 2038]))),
  'H4P4': (dict(file='ART-52_HEAD-4_PAGE-4_Woman-Run8_REVIEW.png', W=2172, text=[(15, 357, 248, 396)]),
           R(('womanrun', (0, 0, 2172, 584), (549, 584), 8, [362, 602, 828, 1073, 1320, 1557, 1787, 2033]))),
  'H4P5': (dict(file='ART-52_HEAD-4_PAGE-5_Child-Run8_REVIEW.png', W=2172, text=[(15, 345, 240, 385)]),
           R(('childrun', (0, 0, 2172, 564), (527, 564), 8, [350, 586, 814, 1061, 1317, 1552, 1781, 2028]))),
  'H5P3': (dict(file='ART-52_HEAD-5_PAGE-3_Man-Run8_REVIEW.png', W=2172, text=[(30, 321, 238, 363)]),
           R(('manrun', (0, 0, 2172, 563), (526, 563), 8, [366, 595, 825, 1059, 1315, 1546, 1775, 2009]))),
  'H5P4': (dict(file='ART-52_HEAD-5_PAGE-4_Woman-Run8_REVIEW.png', W=1774, text=[(40, 230, 290, 290)]),     # (its label printed over the first figure: boxed by hand)
           R(('womanrun', (0, 0, 1774, 694), (660, 694), 8, [145, 368, 584, 800, 1022, 1236, 1443, 1646]))),
  'H5P5': (dict(file='ART-52_HEAD-5_PAGE-5_Child-Run8_REVIEW.png', W=1536, text=[(22, 480, 187, 512)]),
           R(('childrun', (0, 0, 1536, 650), (622, 650), 8, [276, 442, 601, 763, 931, 1094, 1261, 1426]))),
}
VIEW_HEAD = {'SE': 1, 'NE': 2, 'S': 3, 'E': 4, 'N': 5}
ROWS = ['idle', 'walk']
FPS = {'idle': 5, 'walk': 12}


RUNS = {'man': 3, 'woman': 4, 'child': 5}      # (each look's run strip, its page on HEADs 3 to 5)
NEWRUN = {(w, v) for w in RUNS for v in ('S', 'N')}   # the views whose walk is the new strip's (never the old and the new in one look): S and N
# for all three (they lean into the run, the old shadow blobs gone); E keeps the 10-18 profile run for all three -- the new E strips turn
# toward SE (the art desk's own note on the man and the child, "a slight SE component" on the woman), the seat's call, his eye on it


def pages(who, page, new=True):
    """one look's pages: each view's page with that look's two rows, renamed idle and walk; where the view takes the 10-27 strip, its walk
    from that page instead (the old page's walk row left out)"""
    out = {}
    for v, h in VIEW_HEAD.items():
        L = 'H%dP%d' % (h, page)
        p, (rows, xs) = SPEC[L]
        rows = [(r[len(who):], b, s, n) for r, b, s, n in rows if r.startswith(who)]
        out[L] = dict(p, rows=rows, xs={r[len(who):]: x for r, x in xs.items() if r.startswith(who)}, dir='' if h < 3 else 'ART-52')
        if new and (who, v) in NEWRUN:
            R_ = 'H%dP%d' % (h, RUNS[who])
            q, (rr, xx) = SPEC[R_]
            out[R_] = dict(q, rows=[('walk', b, s, n) for r, b, s, n in rr], xs={'walk': xx[who + 'run']}, dir='ART-52')
            out[L]['rows'] = [r for r in out[L]['rows'] if r[0] != 'walk']
    return out


def run_targets(who, page, stand):
    """a run strip scaled so its frames' median height is the old run's (the page's own run row at that page's scale): the size stays
    as it was, only the gait changes -> artdesk's targets {L: ('walk', 0, its first frame's height)}"""
    old = pages(who, page, new=False)
    cuts = AD.cut(ROOT, 'townsfolk', 'ART-52', old, chan=CHAN)
    K = AD.scales(cuts, {v: ('H%dP%d' % (h, page),) for v, h in VIEW_HEAD.items()}, stand, fit)
    new = {L: p for L, p in pages(who, page).items() if L not in old}
    rc = AD.cut(ROOT, 'townsfolk', 'ART-52', new, chan=CHAN)
    out = {}
    for L in new:
        Lo = 'H%sP%d' % (L[1], page)
        want = float(np.median([AD.tall(fit(im, K[Lo])) for im, _, _ in cuts[Lo]['walk']]))
        ims = [im for im, _, _ in rc[L]['walk']]
        lo, hi = 1.0, 20.0
        for _ in range(26):
            k = (lo + hi) / 2
            lo, hi = (k, hi) if float(np.median([AD.tall(fit(im, k)) for im in ims])) > want else (lo, k)
        out[L] = ('walk', 0, AD.tall(fit(ims[0], (lo + hi) / 2)))
        print('  %s %s: the new run at %.2f page px a game px, its median %.0f tall as the old' % (who, L, (lo + hi) / 2, want))
    return out


def fit(img, k):
    """a page's cut at game size: premultiplied box down, a 1-px margin for the outline, snapped to the palette"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the body's rows (the head above and the legs below are thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 60 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def build(who, page, height):
    P = pages(who, page)
    views = {v: ('H%dP%d' % (h, page),) + ((('H%dP%d' % (h, RUNS[who])),) if (who, v) in NEWRUN else ()) for v, h in VIEW_HEAD.items()}
    stand = {'side': height, 'S': height, 'N': height}
    cell = (FW, FH, AX, AY)
    tg = run_targets(who, page, stand)
    first = AD.views(ROOT, 'townsfolk', 'ART-52', P, views, stand, fit, torso_x, cell, chan=CHAN, targets=tg)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'townsfolk', 'ART-52', P, views, stand, fit, torso_x, cell, chan=CHAN, tone_ref=ref, targets=tg)
    frames = {}
    for an in ROWS:
        frames[an] = [d['S'][an], mirror(d['SE'][an]), mirror(d['E'][an]), mirror(d['NE'][an]), d['N'][an], d['NE'][an], d['E'][an], d['SE'][an]]
        if len({len(fs) for fs in frames[an]}) > 1:
            raise SystemExit('%s %s: frame counts differ by facing %s' % (who, an, [len(fs) for fs in frames[an]]))
    return frames


if __name__ == '__main__':
    for name, (who, page, height) in LOOKS.items():
        frames = build(who, page, height)
        pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
        mp = os.path.join(ROOT, 'deep16', 'art', name + '.json')
        meta = json.load(open(mp))
        for an, fps in FPS.items():
            meta['anims'][an]['fps'] = fps
        meta['source'] = 'drawn by the art desk (ART-09 FINAL SE and NE, 10-10; ART-52 REVIEW S, E and N, 10-18; ART-52 RUN REVIEW S and N walks, 10-27), cut by tools/townsfolk-sheet.py through tools/artdesk.py (10-27)'
        json.dump(meta, open(mp, 'w'), indent=1)
        print('  %s: %s' % (name, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
