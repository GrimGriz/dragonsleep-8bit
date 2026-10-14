"""DEEP16 pipeline 2 (generated art): the art desk's four GPT pages of the ogre (ART-06) -> ogre_p2 (the Orc stand-in, ogre_p1, stays on disk).

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
Not read: superseded/ (the earlier versions of pages 1, 2 and 4) and other-generator/ (the brown ogre's .jpg sheets -- Griz, 10-14: "there's
two ogre variants floating around... if one is missing pieces ignore for now").
The pages are ISOMETRIC: HEAD 1 (pages 1, 2) is the ogre from the bottom-right, facing the bottom-right; HEAD 2 (pages 3, 4) from the
top-right, seen from behind, facing the top-right.

Rows (engine <- page row): `idle`, `walk`; `greatclub` and `attack` <- Greatclub (battle.js plays a row named for the attack, its Greatclub;
`attack` is the fallback); `javelin` <- Javelin, its `release` 3 (0-based: the javelin is held through human frame 3 and gone at 4, the arm
thrown forward -- battle.js times the throw by it, the bugbear's way); `flinch` <- Flinch (a blow that lands and doesn't drop it); `hurt` <-
Fall (it goes down, the club dropped); `prone` <- Prone, played pushing-up first so it lies at its last frame and gets up by playing it back
(deep16/js/sprites.js S.proneRow, the hobgoblin's and the ettin's way). Every row has the same frame count in both HEADs.
Facings (deep16/js/sprites.js S.FACINGS: 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE): S, E and SE take HEAD 1 as drawn, SW and W HEAD 1
mirrored (the club changes hands with the mirror, as every mirrored sheet's does); N and NE take HEAD 2 as drawn, NW HEAD 2 mirrored.
Scale: one for the creature in every row and facing, by HEIGHT -- an upright figure. GPT drew each page at its own size (the art log: "Body
size differs across rows/pages"), so each page meets page 1's idle by its standing body: page 1 its idle (177-181 page px), page 2 its Flinch
1 and 4 (the idle's stance, club low: 172), page 3 its idle (201-204: the rear page drawn an eighth bigger), page 4 its Flinch 1 and 4
(171-175). The standing body is measured head to foot with the javelins on the back opened away (OPEN: their count and their tips' height
change row to row, an art issue). Within a page the standing rows agree with its rest within 2-3% but one: page 1's Walk, drawn smaller (FIT
below). The game size: the standing body HEIGHT 80 px, the idle 87-90 px with its javelins and outline in every facing (top 89) -- the Orc
stand-in's idle is drawn 80-94, the troll's (Large) 98-104 but lanky and stooped, the ettin's (Huge) 100-106 and broader; the hobgoblin's
(Medium) 43-51. dev/visions/ogre/lineup.png stands them side by side; HEIGHT is the one number to change.
Colour: TONE brings pages 2, 3 and 4 to page 1 per channel, by the skin (the yellow every view shows): page 2's Flinch 1 and 4 against page 1's
idle; page 3's idle against the turnaround's Back (the turnaround is drawn on page 1); page 4's Flinch 1 and 4 against page 3's idle.
Cut: each row's band runs strip-middle to strip-middle, a page's last row to its foot; the Greatclub 4 impacts (pages 1, 3) and the rear
Fall 4's dust keep their chips and dirt (NUMBOX, FIX, CUT below); keyed by sheetrows' default test (the navy's blue-minus-red 63-78), looked
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
         4: os.path.join('ogre', 'Rear ogre sprite sheet -1.png')}                      # ART-06_HEAD-2_PAGE-2
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
}
SPLIT = {(2, 'prone'): 745}   # (page, row) -> the line between it and the row above, by hand: page 2's Fall 6 drops its club's tip to 730,
                              # the strip's middle; the prone's javelin tips start at 778
# a row whose numbers are boxed one by one, not as a strip: the ground it struck lies between them (page 1's and page 3's Greatclub 4, the
# chips and the dirt round the club; page 4's Fall 4, its dust) -- a strip would drop every speck wholly inside it as lettering. A page's last
# row runs to the page's foot (nothing below it but its numbers)
NUMBOX = {(1, 'greatclub'), (3, 'greatclub'), (4, 'fall')}
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)] -- page 1's and page 3's
# Greatclub 4: the chips flying right of the club lie as near frame 5's foot as their own club
FIX = {1: {'greatclub': [((1030, 940, 1075, 990), '4')]},
       3: {'greatclub': [((1040, 815, 1078, 884), '4')]}}
# a line of pixels cleared: page 3's Greatclub 4, a chip at x 1065-1069 y 876-881 touches frame 5's heel by one corner pixel
CUT = {3: {'greatclub': [((1069, 873), (1069, 883))]}}
TOUCH_OK = {}

# the engine's rows: engine name -> (HEAD 1's (page, row), HEAD 2's (page, row))
ROWS = {'idle': ((1, 'idle'), (3, 'idle')), 'walk': ((1, 'walk'), (3, 'walk')),
        'attack': ((1, 'greatclub'), (3, 'greatclub')), 'greatclub': ((1, 'greatclub'), (3, 'greatclub')),
        'javelin': ((2, 'javelin'), (4, 'javelin')), 'flinch': ((2, 'flinch'), (4, 'flinch')),
        'hurt': ((2, 'fall'), (4, 'fall')), 'prone': ((2, 'prone'), (4, 'prone'))}
REVERSED = {'prone'}                       # the pages draw it lying then pushing up: played backwards, it lies at its last frame
# per facing: (HEAD, mirrored?) -- S, E, SE HEAD 1 as drawn; SW, W HEAD 1 mirrored; N, NE HEAD 2 as drawn; NW HEAD 2 mirrored
FACING = {0: (1, False), 1: (1, True), 2: (1, True), 3: (2, True), 4: (2, False), 5: (2, False), 6: (1, False), 7: (1, False)}
NEW = []              # rows not in pix.ANIM_ORDER (greatclub and javelin are there already: the stone giant's, the bugbears')
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'greatclub': 10, 'javelin': 10, 'flinch': 8, 'hurt': 8, 'prone': 8}
RELEASE = {'javelin': 3}                  # the frame the javelin is gone from the hand (human frame 4, the arm thrown forward): js/battle.js
REST = {1: [('idle', None)], 2: [('flinch', (0, 3))], 3: [('idle', None)], 4: [('flinch', (0, 3))]}   # each page's standing body (row, frames)
# a row drawn at its own size on its page, met to the page's idle by height: page 1's Walk is drawn smaller than its idle (the head and the
# belly, by eye; its standing height 0.93 of the idle's, where the rear Walk on page 3 stands 0.98 of its idle) -- it meets page 1's idle
# keeping the rear walk's stride dip: (page, row) -> (page, row) whose ratio to its own idle is the one kept
FIT = {(1, 'walk'): (3, 'walk')}
# per channel, each later page brought to page 1 by the skin's mean (the yellow every view shows; a whole-figure mean weighs what each view
# shows -- the back is hair, hides and the javelins): page 2's Flinch 1 and 4 (228.2 147.3 53.3 -> page 1's idle 216.0 149.7 61.1); page 3's
# idle (214.5 146.9 51.1) to the turnaround's Back (200.7 140.6 53.4: the colours the art desk's later pages were asked to keep, as the
# ettin's back sheet met its turnaround's Back); page 4's Flinch 1 and 4 (218.8 140.3 41.9) to page 3's idle, toned -- tones() prints them
TONE = {2: (0.947, 1.016, 1.147), 3: (0.936, 0.957, 1.046), 4: (0.918, 1.002, 1.273)}
HEIGHT = 80           # the standing body (head to foot, no javelins), game px before the outline: idle 87-90 px with the javelins and outline
OPEN = 10             # the radius (page px) of the opening that takes the javelins off the standing measure
FH, AY = 136, 124


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


SKIN = lambda a: (a[..., 0] > 120) & (a[..., 1] > 85) & (a[..., 2] < 0.62 * a[..., 1]) & (a[..., 0] >= a[..., 1])
def skin_mean(ims):
    """mean RGB of the skin (bright yellow: red over green over a low blue) over cut frames"""
    px = []
    for im in ims:
        a = np.asarray(im).astype(float)
        sel = (a[..., 3] > 0) & SKIN(a)
        px.append(a[sel][:, :3])
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
    print('  TONE measured: ' + ', '.join('%d: (%.3f, %.3f, %.3f)' % ((L,) + tuple(v)) for L, v in sorted(t.items())))
    fm = lambda L, ims: np.round(figure_mean([toned(im, TONE[L]) if L in TONE else im for im in ims]), 1).tolist()
    print('  figure means (toned): page 1 idle %s, page 2 flinch 1+4 %s; turnaround Back %s, page 3 idle %s, page 4 flinch 1+4 %s'
          % (fm(1, [im for _, im, _ in c[1]['idle']]), fm(2, rest_frames(c, 2)), fm(1, [c[1]['turn'][2][1]]),
             fm(3, [im for _, im, _ in c[3]['idle']]), fm(4, rest_frames(c, 4))))
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
                a = game_frame(im, k, TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / k))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, heads in ROWS.items():
        views = {}
        for h, (L, row) in zip((1, 2), heads):
            fs = frames_of(L, row)
            views[h] = fs[::-1] if eng in REVERSED else fs
        if len(views[1]) != len(views[2]):
            raise SystemExit('%s: frame counts differ by HEAD %d %d' % (eng, len(views[1]), len(views[2])))
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
    meta['source'] = ('generated by the art desk (ART-06, 2026-10-10: four GPT pages -- HEAD 1 from the bottom-right, HEAD 2 from the top-right '
                      'behind, two pages each), cut by tools/ogre-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    print('  idle opaque height with outline, by facing (S SW W NW N NE E SE): %s; top %d' % (
        ' '.join('%d-%d' % (min(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]), max(h(fr)[-1] - h(fr)[0] + 1 for fr in frames['idle'][f]))
                 for f in range(8)), meta['top']))
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
