"""DEEP16 pipeline 2 (generated art): Griz's three GPT sheets of the spirit naga -> naga_p2.

    python tools/naga-sheet.py            (writes deep16/art/naga_p2.png/.json)
    python tools/naga-sheet.py check      (also the cut overlays, dev/visions/naga/cut-<n>.png, and a lineup beside the troll and the gnoll)

Sources (gitignored, the main checkout's -- a worktree reads them there), all in deep16/_src/naga/: Spirit Naga animation sprite sheet-4.png
(the side: a portrait, a turnaround Front, Right, Back, Left, and rows facing RIGHT), Spirit Naga Front Animation Sheet-4.png (from the
front) and Six back-view naga idle sprites-12.png (from behind: Griz's re-roll of the whole sheet, in place of Spirit Naga Back-View Animation
Sheet-7.png, which dropped an idle frame) -- Griz, 2026-10-08, from the pastes in deep16-art-in-hand.md ("The stand-ins' first sheets", the
spirit naga; "The six's fronts and backs", the spirit naga from the front and from behind). It replaces the stand-in naga_p1 (a snake).

Sheet 1: idle 6, slither 8, bite 6, cast 6, flinch 4, fall 6, prone 2 -- but its Slither drew seven bodies over eight numbers (the 7 and the
8 sit under one drawing), so the side slither has seven frames. Sheets 2 (the front) and 3 (behind): idle 6, slither 8, bite 6, cast 6, flinch 4.
The engine's rows: idle; walk the slither; bite and attack (the fallback) the bite (battle.js plays a row named for the attack); cast;
flinch; hurt the fall; prone the sheet's Prone played lying-last (flat, then rearing up: reversed, so it lies at its last frame and gets up by
playing it back -- deep16/js/sprites.js S.proneRow, the goblin's way).
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored; S takes sheet 2's rows and N sheet 3's for idle, walk, bite (and
attack), cast and flinch; the fall and prone play side-on from S and N too. Since 10-22 the art desk's ART-36 (art36 below) draws SE and NE
every row, and S, N and E the spiral fall and its prone: E keeps sheet 1's idle, slither, bite, cast and flinch, S and N sheets 2's and 3's. A row has one frame count in every facing: the front's and the
back's slither drop one of their eight to meet the side's seven (DROP: the frame whose neighbours are likest, so the loop skips least).
Scale: one K per sheet, sheet px a game px. Sheet 1's rows set HEIGHT, the side idle's standing px (the stand-in's side idle stood 94-97);
its turnaround (drawn bigger than its rows) meets them by its Right and Left against the side idle, by area; sheets 2 and 3 meet the
turnaround by their idles against its Front and its Back, by area (holes filled -- the coiled body is most of it; the hair flies about).
The cast's violet light (dim wisps and sparks round the head, on navy) is kept by place and colour (the goose's glow, the mirror gnoll's
glint): a pixel violet enough is figure, though the navy cut would drop it; at game size it is drawn where its block on the sheet holds
enough of it, in its own colour, with no outline of its own (the body keeps its outline). The black scales are blue-black on the navy: the
navy cut left holes in the coils, filled by colour (figure_mask), the navy seen through a curl of the tail kept. Colour: the front and back
sheets drew the bands a redder red than sheet 1, and broader; each is brought to sheet 1's per channel and per colour -- the red bands, the
light (face, belly), the dark (scales, hair) -- against the turnaround's Front and Back (TONE, printed as it is measured), the glow left be.
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

FILES = {1: os.path.join('naga', 'Spirit Naga animation sprite sheet-4.png'), 2: os.path.join('naga', 'Spirit Naga Front Animation Sheet-4.png'),
         3: os.path.join('naga', 'Six back-view naga idle sprites-12.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; each number gets its own box below, so the cast's sparks
# beside a number are not taken for it), and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the frames' x off the probe,
# [the numbers' x where they differ from the frames'])
SHEETS = {
  1: dict(text=[(0, 205, 124, 1024)],
          rows=[('turn', (380, 0, 1300, 178), (178, 203), TURN, [512, 718, 934, 1159]),
                ('idle', (0, 203, 1536, None), (330, 344), NUM(6), [209, 392, 577, 760, 937, 1123]),
                ('slither', (0, None, 1536, None), (437, 451), NUM(6) + ['7+8'], [214, 399, 604, 793, 999, 1207, 1420],
                 [214, 399, 604, 793, 999, 1207, 1384, 1504]),
                ('bite', (0, None, 1536, None), (556, 570), NUM(6), [209, 378, 551, 761, 973, 1168]),
                ('cast', (0, None, 1536, None), (707, 721), NUM(6), [200, 370, 555, 745, 938, 1127]),
                ('flinch', (0, None, 1536, None), (816, 830), NUM(4), [207, 406, 590, 774]),
                ('fall', (0, None, 1536, None), (906, 920), NUM(6), [207, 419, 619, 853, 1091, 1371]),
                ('prone', (0, None, 1536, None), (999, 1012), NUM(2), [255, 538])]),
  2: dict(text=[(0, 0, 136, 1024)],
          rows=[('idle', (0, 0, 1536, None), (187, 206), NUM(6), [256, 477, 696, 905, 1121, 1350]),
                ('slither', (0, None, 1536, None), (388, 407), NUM(8), [211, 376, 554, 717, 900, 1075, 1254, 1421]),
                ('bite', (0, None, 1536, None), (588, 608), NUM(6), [256, 472, 692, 919, 1136, 1353]),
                ('cast', (0, None, 1536, None), (796, 815), NUM(6), [253, 472, 692, 907, 1129, 1352]),
                ('flinch', (0, None, 1536, None), (981, 999), NUM(4), [354, 637, 895, 1163])]),
  3: dict(text=[(0, 0, 127, 1024)],
          rows=[('idle', (0, 0, 1536, None), (191, 210), NUM(6), [238, 460, 688, 929, 1153, 1387]),
                ('slither', (0, None, 1536, None), (370, 387), NUM(8), [212, 390, 565, 742, 919, 1099, 1270, 1447]),
                ('bite', (0, None, 1536, None), (578, 595), NUM(6), [223, 442, 659, 873, 1108, 1348]),
                ('cast', (0, None, 1536, None), (792, 809), NUM(6), [222, 442, 668, 896, 1112, 1338]),
                ('flinch', (0, None, 1536, None), (969, 986), NUM(4), [235, 502, 760, 1013])]),
}
SPLIT = {(1, 'cast'): 552}   # (sheet, row) -> the line between it and the row above, by hand: the cast's light reaches up past the bite's
                             # numbers (cast 4's ring tops out at 560) while the bites' bottoms end at 550
# painted navy whole before the cut: the portrait's foot inside the idle band (its coils down to 268 beside idle 1, a lock of its hair down
# to 232 just over idle 1's head, which starts at 234)
BLANK = {1: [(0, 195, 214, 272), (214, 195, 300, 233)]}
FIX, CUT, TOUCH_OK = {}, {}, {}

# the engine's rows: (sheet 1's row); S and N take sheets 2 and 3 for the rows they drew
FRONT = BACK = ('idle', 'slither', 'bite', 'cast', 'flinch')
ROWS = {'idle': 'idle', 'walk': 'slither', 'bite': 'bite', 'attack': 'bite', 'cast': 'cast', 'flinch': 'flinch', 'hurt': 'fall', 'prone': 'prone'}
NEW = []              # (every row is in pixelate.py's ANIM_ORDER already)
FPS = {'idle': 5, 'walk': 8, 'bite': 10, 'attack': 10, 'cast': 8, 'flinch': 10, 'hurt': 8, 'prone': 8}
TONE = {}             # filled by tones() below and printed: per channel and colour, sheets 2 and 3 to sheet 1
HEIGHT = 90           # the side idle, standing px (the stand-in's side idle 94-97; the troll's 102)
GLOW_CUT = 0.3        # a game pixel is glow where its block on the sheet is this much violet


def violet(rgb):
    """the cast's light: violet to pink-white (red and blue both well over green) -- the bands' red has no blue, the scales and hair no
    red over green, the navy no red at all"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (b - g > 30) & (r - g > 20) & (r > 40)


def figure_mask(a, grey=20, far=150, chan=None):
    """sheetrows' figure (grey or far from the navy), the violet light, which on navy is neither, and the black scales' blue-black (20 29 45
    or so: some red in it, the navy has none -- its red 1, 5 at most) where the navy cut left holes in the coils; a hole that is the navy
    seen through a curl of the tail (its red 2-7, a little darker than the open navy: its brightest channel 15-25 under the navy's) stays a
    hole; one far darker than that is the shadow between two coils (the front sheet's 5 17 35 on a navy of 1 32 82)"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    bg = a[..., 2] - a[..., 1]                                    # (blue over green: the scales' 16-18, the navy's 48, the light's haze more)
    m = _figure_mask(a, grey, far, chan) | violet(a) | ((a[..., 0] >= 12) & (bg < 30) & (np.abs(a - navy).sum(-1) > 30))
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        idx = range(1, n + 1)
        red, top, hue = ndimage.mean(a[..., 0], lab, idx), ndimage.mean(a.max(-1), lab, idx), ndimage.mean(bg, lab, idx)
        m |= np.isin(lab, 1 + np.where(((red >= 10) | (top < navy.max() - 35)) & (hue < 30))[0])   # (not the navy inside the light's ring)
    return m
_figure_mask = SR.figure_mask


def classes(rgb):
    """each pixel's share in the three colours it is drawn in: the red bands, the light (the face, the belly's cream) and the dark (the black
    scales and the hair) -- soft, so a toned band has no edge"""
    rgb = rgb.astype(float)
    r, g = rgb[..., 0], rgb[..., 1]
    red = np.clip((r / np.maximum(g, 1) - 1.4) / 0.5, 0, 1) * np.clip((r - 50) / 30, 0, 1)
    light = (1 - red) * np.clip((rgb.mean(-1) - 90) / 40, 0, 1)
    return red, light, 1 - red - light


def toned(a, f):
    """each class's channels times its own factors: f = (red, light, dark), three (r, g, b) each"""
    a = a.astype(float)
    w = classes(a[..., :3])
    a[..., :3] = np.clip(a[..., :3] * sum(wi[..., None] * np.array(fi) for wi, fi in zip(w, f)), 0, 255)
    return a.astype(np.uint8)


def split_glow(a, glowrow):
    """a cut frame's body and its light (the light: violet pixels the body doesn't enclose; in a cast row, the loose sparks too)"""
    solid = a[..., 3] > 0
    body = ndimage.binary_fill_holes(solid & ~violet(a[..., :3])) & solid
    if glowrow:
        lab, n = ndimage.label(body, structure=np.ones((3, 3)))
        if n > 1:
            sz = ndimage.sum(body, lab, range(1, n + 1))
            body = np.isin(lab, 1 + np.where(sz >= 25)[0])           # (a hair tip may go with them: drawn the same, unoutlined)
    return body, solid & ~body


def game_frame(im, k, tone=None, glowrow=False):
    """a cut frame at game size: the body palette-snapped and outlined (toned to sheet 1), its light kept by place and colour"""
    a = np.asarray(im).copy()
    body, glow = split_glow(a, glowrow)
    b = a.copy(); b[~body, 3] = 0
    if tone:
        b = toned(b, tone)
    w, h = im.size
    size = (max(1, round(w / k)), max(1, round(h / k)))
    out = pix.pixelate(Image.fromarray(b, 'RGBA').resize(size, Image.BOX), 1, do_lift=False)
    if glow.any():
        g = a.copy(); g[~glow, 3] = 0
        gs = np.asarray(Image.fromarray(g, 'RGBA').resize(size, Image.BOX)).astype(float)
        hit = (gs[..., 3] >= GLOW_CUT * 255) & (out[..., 3] == 0)
        if hit.any():
            out[hit, :3] = pix.snap(gs[hit][None, :, :3] / 255.0)[0]
            out[hit, 3] = 255
    return out


def core_x(a):
    """x of the body's thick middle (the coils; the neck, the tail and the light are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im, glowrow=False):
    """a cut frame's measures on the sheet: sqrt of its body's area (holes filled, no light) and its height"""
    m, _ = split_glow(np.asarray(im), glowrow)
    m = ndimage.binary_fill_holes(m)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def place(a, x_ref, up, fw, ax, FH, AY):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
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
    text = list(s['text'])
    for r in rows:
        (x0, _, x1, _), (l0, l1) = r[1], r[2]
        if r[0] == 'turn':
            text.append((x0, l0 - 3, x1, l1 + 4))                 # (the turnaround's words, a strip)
        else:
            text += [(int(x) - 16, l0 - 3, int(x) + 16, l1 + 4) for x in (r[5] if len(r) > 5 else r[4])]   # (a number's drop shadow too)
    spec = dict(text=text, rows=[(r[0], r[1], (r[1][1], r[2][1]), r[3]) for r in rows])
    orig = SR.label_xs
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    SR.figure_mask = figure_mask
    over = [] if check else None
    path = os.path.join(SRC, FILES[L])
    if L in BLANK:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'naga-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
        SR.figure_mask = _figure_mask
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'naga'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    turn = {nm: body(im)[0] for nm, im, _ in c[1]['turn']}
    kt = k1 * (turn['right'] + turn['left']) / 2 / med(c[1]['idle'])
    k2 = kt * med(c[2]['idle']) / turn['front']
    k3 = kt * med(c[3]['idle']) / turn['back']
    print('  K: sheet 1 %.3f, its turnaround %.3f (%.2f of its rows), the front %.3f, behind %.3f; the side idle %d px, from the front %.0f px, '
          'from behind %.0f px' % (k1, kt, kt / k1, k2, k3, HEIGHT, med(c[2]['idle'], 1) / k2, med(c[3]['idle'], 1) / k3))
    return {1: k1, 2: k2, 3: k3}


def tones(c):
    """each later sheet's body brought to sheet 1's per channel and per colour: its idle's mean RGB in each class (the red bands, the light,
    the dark; the cast's light left out) against the turnaround's view of the same side, measured on the sheet. One factor for the whole
    body would not do: the front and back drew the bands redder and broader (a fifth of the body to sheet 1's seventh, red 147 and 142 to
    its 126), the black scales as sheet 1 did -- the whole body's mean would take the red out of everything and turn the cream green."""
    def means(frs):
        px = []
        for _, im, _ in frs:
            a = np.asarray(im); bm, _ = split_glow(a, False)
            px.append(a[bm & (a[..., 3] > 0), :3].astype(float))
        p = np.concatenate(px)
        return [(w[:, None] * p).sum(0) / w.sum() for w in classes(p)]
    turn = {nm: (nm, im, box) for nm, im, box in c[1]['turn']}
    out = {}
    for L, view in ((2, 'front'), (3, 'back')):
        want, got = means([turn[view]]), means(c[L]['idle'])
        out[L] = tuple(tuple(float('%.3f' % (w / g)) for w, g in zip(wc, gc)) for wc, gc in zip(want, got))
        print('  TONE sheet %d to the turnaround\'s %s: %s' % (L, view, '; '.join('%s %s to %s: %s' % (nm, '%.0f %.0f %.0f' % tuple(gc), '%.0f %.0f %.0f' % tuple(wc), f)
              for nm, wc, gc, f in zip(('red', 'light', 'dark'), want, got, out[L]))))
    return out


def drop_one(frs):
    """eight frames to seven: drop the frame whose two neighbours are likest (the loop skips least), by their pixels at game size"""
    def diff(p, q):
        H = max(p[0].shape[0], q[0].shape[0]); W = max(p[0].shape[1], q[0].shape[1])
        def pad(fr):
            a, cx, up = fr
            o = np.zeros((H + 4, W + 40), float)
            ox = int(round((W + 40) / 2 - cx)); oy = H + 2 - a.shape[0] - up
            al = a[..., 3] > 0
            o[max(0, oy):oy + a.shape[0], max(0, ox):ox + a.shape[1]] = al[max(0, -oy):, max(0, -ox):][:o.shape[0] - max(0, oy), :o.shape[1] - max(0, ox)]
            return o
        return float(np.abs(pad(p) - pad(q)).sum())
    n = len(frs)
    cost = [diff(frs[(i - 1) % n], frs[(i + 1) % n]) for i in range(n)]
    i = int(np.argmin(cost))
    return [f for j, f in enumerate(frs) if j != i], i


# ---------------------------------------------------------------- ART-36 (10-22, the monster cutter seat's fourth run, on Griz's "close the desk but
# have the cutter run us out of usage for the week. See y'all tueday"): the art desk's facings package, nine pages -- HEAD 1 SE and HEAD 2 NE every
# row (Idle 6, Slither 7, Bite 6, Cast 6, Flinch 4, Fall 6, Prone 2), HEAD 3 S and HEAD 5 N their Fall and Prone, and HEAD 4 E its Fall and Prone
# (his side-view spiral supplement, 10-17: "to match the existing E/W fall to the new spiral action" -- it replaces sheet 1's fall and prone east
# and west; E's idle, slither, bite, cast and flinch stay sheet 1's). Every Fall is the spiral he asked for: the raised neck curls down into flat
# coils, and played backwards it rises. Sorted out of Fresh into _src/naga/ART-36/ by _src/art-desk/sort-delivery.py (the zip with HEAD 4 in it;
# the first, eight pages, filed as superseded). Cut by tools/artdesk.py with this cutter's own figure_mask (the blue-black scales, the light);
# scaled there: SE's Idle meets the mean of this sheet's side and front idles, NE's of its side and back (the facings ruling's rule), a later page
# by its Fall 1 (a page's fall is its `hurt`; the bite page by its Bite 1) against its Idle 1, S's, N's and E's Fall 1 their own idle; toned per colour, as sheets 2 and 3 are (tones36). Placed as this
# cutter places its own: each frame's coils on the anchor, its foot by its box against the row's ground. The boxes by the seat's draft (each
# page's bodies into the art desk's bands).
AD = _load('artdesk', os.path.join(ROOT, 'tools', 'artdesk.py'))

def R(*rows):
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC36 = {
  'H1P1': (dict(file='ART-36_HEAD-1_PAGE-1.png', W=2172, text=[(24, 406, 49, 440), (31, 198, 51, 232), (49, 406, 63, 440), (50, 198, 75, 232), (65, 406, 78, 440), (76, 198, 90, 232), (77, 406, 99, 440), (90, 205, 115, 232), (97, 406, 169, 440), (183, 636, 201, 664), (305, 322, 323, 350), (478, 636, 499, 664), (615, 322, 637, 350), (784, 636, 805, 664), (933, 322, 955, 350), (1084, 636, 1105, 664), (1250, 322, 1271, 350), (1391, 636, 1412, 664), (1569, 322, 1590, 350), (1687, 636, 1708, 664), (1889, 322, 1911, 350), (1998, 636, 2019, 664)]),
           R(('idle', (0, 0, 2172, 435), (276, 435), 6, [316, 633, 948, 1266, 1584, 1903]), ('slither', (0, 436, 2172, 721), (594, 721), 7, [188, 487, 788, 1111, 1407, 1712, 2018]))),
  # (H3P1, H4P1: the row name Fall boxed whole by hand -- the draft missed its second l, and a letter's shadow fell outside its box)
  # (H1P2: the bite band ends under its numbers, 316-344 -- Cast 4's violet ring reaches up to 372, past them, as sheet 1's SPLIT)
  'H1P2': (dict(file='ART-36_HEAD-1_PAGE-2.png', W=2172, text=[(26, 532, 51, 564), (27, 227, 52, 260), (49, 538, 74, 564), (51, 227, 86, 260), (72, 538, 94, 564), (84, 233, 108, 260), (92, 532, 113, 564), (263, 316, 281, 344), (263, 633, 281, 661), (579, 633, 601, 661), (580, 317, 601, 345), (898, 317, 919, 345), (898, 633, 919, 661), (1271, 317, 1293, 345), (1271, 635, 1292, 664), (1621, 633, 1643, 661), (1641, 317, 1662, 345), (1972, 318, 1993, 346), (1972, 636, 1993, 663)]),
           R(('bite', (0, 0, 2172, 356), (275, 356), 6, [290, 608, 923, 1291, 1666, 1988]), ('cast', (0, 357, 2172, 721), (591, 721), 6, [293, 600, 922, 1239, 1639, 1979]))),
  'H1P3': (dict(file='ART-36_HEAD-1_PAGE-3.png', W=1983, text=[(29, 385, 54, 418), (37, 137, 62, 170), (43, 614, 70, 647), (51, 391, 76, 418), (59, 135, 76, 170), (69, 620, 92, 647), (73, 383, 90, 418), (76, 136, 97, 170), (91, 383, 107, 418), (91, 620, 117, 647), (96, 143, 123, 170), (117, 620, 143, 647), (122, 143, 147, 170), (142, 620, 168, 647), (146, 135, 174, 170), (247, 506, 264, 534), (396, 247, 414, 275), (538, 507, 559, 534), (690, 749, 708, 777), (780, 247, 802, 275), (831, 509, 853, 536), (874, 123, 892, 132), (1102, 749, 1123, 777), (1131, 509, 1152, 537), (1137, 247, 1159, 275), (1465, 511, 1486, 538), (1479, 247, 1500, 275), (1780, 511, 1802, 539)]),
           R(('flinch', (0, 0, 1983, 276), (205, 276), 4, [403, 780, 1141, 1493]), ('hurt', (0, 277, 1983, 558), (464, 558), 6, [259, 559, 851, 1147, 1457, 1782]), ('prone', (0, 559, 1983, 790), (708, 790), 2, [681, 1118]))),
  'H2P1': (dict(file='ART-36_HEAD-2_PAGE-1.png', W=1705, text=[(22, 251, 41, 285), (22, 567, 45, 599), (39, 251, 64, 285), (44, 567, 69, 598), (64, 251, 77, 285), (67, 567, 87, 598), (77, 258, 101, 285), (85, 567, 149, 598), (158, 785, 176, 812), (232, 404, 250, 431), (418, 785, 439, 812), (488, 404, 509, 431), (650, 785, 671, 812), (740, 404, 761, 431), (874, 785, 896, 812), (990, 404, 1012, 431), (1103, 785, 1124, 812), (1252, 404, 1273, 431), (1332, 785, 1352, 812), (1514, 404, 1535, 431), (1562, 785, 1583, 812)]),
           R(('idle', (0, 0, 1705, 515), (364, 515), 6, [271, 532, 784, 1041, 1309, 1562]), ('slither', (0, 516, 1705, 919), (745, 919), 7, [206, 466, 697, 916, 1139, 1371, 1593]))),
  'H2P2': (dict(file='ART-36_HEAD-2_PAGE-2.png', W=1706, text=[(20, 251, 44, 284), (20, 568, 44, 601), (43, 251, 57, 284), (43, 573, 68, 601), (55, 251, 75, 284), (66, 573, 90, 601), (74, 257, 98, 285), (88, 568, 108, 601), (183, 797, 202, 827), (232, 405, 251, 434), (443, 797, 466, 827), (488, 405, 510, 434), (703, 797, 726, 827), (739, 405, 761, 434), (974, 797, 999, 827), (990, 405, 1014, 434), (1247, 797, 1270, 827), (1253, 405, 1275, 434), (1515, 405, 1537, 434), (1518, 797, 1541, 827)]),
           R(('bite', (0, 0, 1706, 472), (368, 472), 6, [270, 528, 783, 1058, 1316, 1563]), ('cast', (0, 473, 1706, 919), (761, 919), 6, [237, 491, 742, 1020, 1283, 1555]))),
  'H2P3': (dict(file='ART-36_HEAD-2_PAGE-3.png', W=1705, text=[(23, 138, 48, 172), (23, 456, 48, 490), (23, 744, 48, 778), (47, 138, 61, 172), (47, 463, 72, 490), (47, 750, 69, 778), (60, 138, 74, 172), (66, 750, 91, 778), (71, 456, 85, 490), (73, 145, 99, 172), (84, 456, 98, 490), (89, 750, 115, 778), (97, 145, 122, 172), (113, 750, 138, 778), (120, 138, 145, 172), (201, 604, 219, 633), (319, 867, 337, 895), (337, 286, 355, 314), (448, 604, 470, 633), (638, 286, 660, 315), (705, 604, 727, 633), (705, 867, 727, 895), (939, 286, 961, 315), (969, 604, 992, 633), (1235, 286, 1259, 315), (1243, 604, 1265, 633), (1536, 604, 1557, 633)]),
           R(('flinch', (0, 0, 1705, 343), (252, 343), 4, [361, 665, 969, 1271]), ('hurt', (0, 344, 1705, 646), (565, 646), 6, [238, 482, 723, 986, 1258, 1542]), ('prone', (0, 647, 1705, 919), (838, 919), 2, [355, 736]))),
  'H3P1': (dict(file='ART-36_HEAD-3_PAGE-1.png', W=2172, text=[(20, 205, 125, 255), (28, 214, 53, 248), (28, 532, 54, 565), (52, 222, 76, 248), (53, 539, 99, 565), (77, 214, 91, 248), (99, 539, 148, 565), (400, 671, 418, 699), (798, 671, 820, 699), (894, 375, 916, 402), (1215, 375, 1235, 402), (1555, 375, 1577, 403), (1938, 375, 1960, 403)]),
           R(('hurt', (0, 0, 2172, 429), (331, 429), 6, [299, 613, 914, 1224, 1569, 1953]), ('prone', (0, 430, 2172, 721), (632, 721), 2, [417, 816]))),
  'H4P1': (dict(file='ART-36_HEAD-4_PAGE-1.png', W=2172, text=[(20, 205, 125, 255), (29, 211, 55, 245), (30, 511, 56, 544), (53, 218, 78, 245), (55, 518, 103, 544), (78, 210, 108, 245), (101, 517, 153, 544), (261, 348, 280, 377), (569, 349, 592, 378), (799, 635, 818, 665), (878, 348, 901, 378), (1203, 348, 1226, 378), (1208, 635, 1231, 665), (1539, 349, 1562, 378), (1921, 349, 1944, 378)]),
           R(('hurt', (0, 0, 2172, 399), (307, 399), 6, [296, 606, 906, 1229, 1548, 1932]), ('prone', (0, 400, 2172, 721), (592, 721), 2, [814, 1243]))),
  'H5P1': (dict(file='ART-36_HEAD-5_PAGE-1.png', W=1774, text=[(29, 260, 53, 293), (29, 617, 57, 650), (49, 267, 73, 293), (55, 623, 78, 649), (73, 260, 88, 293), (76, 623, 100, 650), (90, 260, 105, 293), (98, 623, 145, 649), (228, 422, 247, 449), (342, 762, 361, 788), (468, 422, 489, 449), (716, 422, 737, 449), (744, 765, 765, 792), (976, 422, 996, 449), (1246, 422, 1266, 449), (1562, 422, 1582, 449)]),
           R(('hurt', (0, 0, 1774, 504), (379, 504), 6, [259, 500, 745, 997, 1262, 1575]), ('prone', (0, 505, 1774, 884), (720, 884), 2, [377, 778]))),
}
PAGES36 = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC36.items()}
VIEWS36 = {'SE': ('H1P1', 'H1P2', 'H1P3'), 'NE': ('H2P1', 'H2P2', 'H2P3'), 'S': ('H3P1',), 'N': ('H5P1',), 'E': ('H4P1',)}
ENG36 = {'idle': 'idle', 'walk': 'slither', 'bite': 'bite', 'attack': 'bite', 'cast': 'cast', 'flinch': 'flinch', 'hurt': 'hurt', 'prone': 'prone'}


def tones36(cuts, K, own):
    """each page's body brought to this sheet's own frame for its view per colour (the red bands, the light, the dark: classes), as tones()
    brings sheets 2 and 3 -- its standing frame (Idle 1, else Fall 1, else Bite 1) against the sheet's idle 1 for the view (SE, NE and E against the side),
    both at game size and snapped, twice (the snap moves what the tone moved); the cast's light is never toned; a colour with under 20 px
    on either side keeps its factor"""
    def means(a):
        p = a[a[..., 3] > 0, :3].astype(float)
        return [((w[:, None] * p).sum(0) / max(w.sum(), 1e-6), w.sum()) for w in classes(p)]
    T = {}
    for v, ls in VIEWS36.items():
        want = means(own['side' if v in ('SE', 'NE', 'E') else v][0][0])
        for L in ls:
            im = (cuts[L]['idle'] if 'idle' in cuts[L] else cuts[L]['hurt'] if 'hurt' in cuts[L] else next(iter(cuts[L].values())))[0][0]
            f = ((1.0, 1.0, 1.0),) * 3
            for _ in range(2):
                got = means(game_frame(im, K[L], f))
                f = tuple(fc if min(nw, ng) < 20 else tuple(fi * w / max(g, 1.0) for fi, w, g in zip(fc, wc, gc))
                          for fc, (wc, nw), (gc, ng) in zip(f, want, got))
            T[L] = tuple(tuple(float('%.3f' % x) for x in fc) for fc in f)
    print('  ART-36 tone: ' + '; '.join('%s %s' % (L, ' / '.join('%.2f %.2f %.2f' % fc for fc in T[L])) for L in T))
    return T


def art36(frames_of):
    """{view: {engine row: [(1x frame, core x, up)]}} from ART-36, at this sheet's sizes"""
    fit = lambda im, k: game_frame(im, k)
    tall = lambda a: int(np.ptp(np.where(a[..., 3].any(axis=1))[0]) + 1)
    own = {'side': frames_of(1, 'idle'), 'S': frames_of(2, 'idle'), 'N': frames_of(3, 'idle')}
    idle_h = {v: float(np.median([tall(a) for a, _, _ in fs])) for v, fs in own.items()}
    idle_h['E'] = idle_h['side']
    cuts = AD.cut(ROOT, 'naga', 'ART-36', PAGES36, mask=figure_mask)
    K = AD.scales(cuts, VIEWS36, idle_h, fit)
    T = tones36(cuts, K, own)
    print('  ART-36 K: ' + ', '.join('%s %.2f' % (L, K[L]) for L in PAGES36) + '; this sheet stands %.0f side-on, %.0f front, %.0f back' % (idle_h['side'], idle_h['S'], idle_h['N']))
    out = {}
    for v, ls in VIEWS36.items():
        rows = {}
        for L in ls:
            for r, frs in cuts[L].items():
                floor = max(b[3] for _, b, _ in frs)
                fs = []
                for im, box, _ in frs:
                    a = game_frame(im, K[L], T[L], glowrow=(r == 'cast'))
                    fs.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
                rows[r] = fs
        out[v] = {eng: (rows[r][::-1] if eng == 'prone' else rows[r]) for eng, r in ENG36.items() if r in rows}
    return out



def main(check=False):
    global TONE
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    TONE = tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L), glowrow=(row == 'cast'))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    A36 = art36(frames_of)
    src, dropped = {}, {}
    for eng, row in ROWS.items():
        side = frames_of(1, row)
        if eng == 'prone':
            side = side[::-1]                                  # rearing, then flat: it lies at its last frame and gets up by playing it back
        per = []
        for f in range(8):
            v36 = {7: 'SE', 1: 'SE', 5: 'NE', 3: 'NE', 0: 'S', 4: 'N', 6: 'E', 2: 'E'}.get(f)     # (ART-36: SW, W and NW mirrored below, as every west)
            if v36 and eng in A36.get(v36, {}):
                per.append(A36[v36][eng]); continue
            fs = side
            if (f == 0 and row in FRONT) or (f == 4 and row in BACK):
                L = 2 if f == 0 else 3
                fs = frames_of(L, row)
                if len(fs) == len(side) + 1:
                    fs, i = drop_one(fs)
                    dropped[(L, row)] = i + 1
            per.append(fs)
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
    for (L, row), i in sorted(dropped.items()):
        print('  sheet %d %s: frame %d dropped (%d to the side\'s %d)' % (L, row, i, len(c[L][row]), len(c[1][row])))
    def rise(a, up):                                           # how far a frame reaches above the foot
        ys = np.where(a[..., 3].any(1))[0]
        return ys[-1] - ys[0] + up
    AY = int(max(rise(a, up) for per in src.values() for fs in per for a, _, up in fs)) + 3
    FH = AY + 8
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2, FH, AY)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'naga_p2'
    fw0 = sizes['idle'][0]
    pix.write_sheet(name, frames, fw0, FH, fw0 // 2, AY, pix.top_of([fr for f in (0, 4, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: three GPT sheets -- the side with its turnaround, then one from the front and one from '
                      'behind, the re-roll), cut by tools/naga-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('  frame %d high, the foot at %d; widths %s' % (FH, AY, ', '.join('%s %d' % (e, s[0]) for e, s in sizes.items())))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'naga')
        lineup(os.path.join(d, 'lineup.png'))


def lineup(path):
    """the gnoll (Medium), the old stand-in, the naga (E, S, N idle, E cast), the troll (Large), at 4x on a grey floor (its size, for the eye)"""
    def first(name, anim, f, i=0):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        a = im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']]
        xs = np.where(a[..., 3].any(0))[0]                      # (its own columns only: the frames are wide)
        return a[:, xs[0]:xs[-1] + 1], an['ax'] - xs[0], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('naga_p1', 'idle', 6), first('naga_p2', 'idle', 6), first('naga_p2', 'idle', 0),
            first('naga_p2', 'idle', 4), first('naga_p2', 'cast', 6, 3), first('troll_p1', 'idle', 6)]
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
