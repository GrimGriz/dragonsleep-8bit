"""DEEP16 pipeline 2 (generated art): Griz's generated hyena sheet -> one palette sprite sheet, the hyena.

    python tools/hyena-sheet.py            # deep16/art/hyena_p2.png + .json
    python tools/hyena-sheet.py preview    # dev/shots/hyena-cuts.png: every anim, the five drawn views side by side, 2x, on grey

Source: deep16/_src/hyena_grok_1.webp (Griz, 2026-09-29, generated; "these properly prompted sheets good for 1 sheet results" --
one sheet is all there is for this creature). A portrait (dropped), a turnaround (front, right, back, left) and rows facing right:
idle 8, walk 8, run 8, bite 8, laugh 6, hurt 6, death 8. The hyenas run with the gnolls (the Snoot's fight: a glory-seeker, two
gnolls, two hyenas); the brief was "the same scale as a gnoll (a four-legged animal, its back about a gnoll's waist high)".
What each row became:
    idle    <- the IDLE row (8)
    walk    <- the WALK row (8)                      (the RUN row is not used)
    attack  <- the BITE row (8)
    hurt    <- the DEATH row (8): the engine plays `hurt` once when a creature goes down, as every generated sheet does
    flinch  <- the HURT row (6): a blow that lands and doesn't drop it, played once
    (the LAUGH row is not used)
Facings (until ART-30, below): the side rows took the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored, as the gnoll's
did); S is the turnaround's Front still and N its Back still, with the gnoll file's bob and dip tricks (idle breathes, walk bobs,
the bite dips toward -- or, from behind, away from -- the eye); S/N took the side frames for hurt and flinch.
One scale for every side row, set by the idle row's mean height so a hyena stands 36 px to the top of the head (34 px of body
and the outline round it; the gnoll_p2 stands 60): its back comes to a gnoll's waist. The stills get their own scale (they are
drawn larger), set (until ART-30) by the front and back stills' mean height, so they stood the same. Each row's frames are cut from one common
window (the row's own top and bottom), so a paw that lifts stays lifted and a row keeps the ground it was drawn on; each is
placed on its torso, so the head, tail and lunge swing without moving the body. A component pass inside each row's band drops
the frame numbers and the row labels by their size.
The ROFL row (09-30): deep16/_src/hyena_grok_2.webp (Griz, 2026-09-30, generated; a second sheet whose rows run idle, walk
north/south, run, bite, laugh, "ROFL (hideous laughter spell reaction)", hurt, death). Only its ROFL row is used, as `rofl`:
its figures 2-7 ("except frame one, where they gave it 2 heads"), played there and back (2..7..3) so it rolls on the floor
rather than jumping from its last pose to its first. They are cut at that sheet's own scale, set by its idle row's height
the way the first sheet's is, so the rolling hyena is the standing one's size. The grid plays it while a hyena laughs
(deep16/js/ui.js unitObj). E and W keep it so.
ART-30 (10-15): the art desk drew the views the sheet lacked (RULED 10-14, five drawn views: S, SE, E, NE, N; SE mirrors to SW, E
to W, NE to NW), six pages of 24 in deep16/_src/hyena/ART-30/ (its ART-30-FINAL-MANIFEST.md; the desk's papers in
_src/art-desk/received-2026-10-15-ART-30/), each cut by its own row and number labels (tools/sheetrows.py):
    H1P1  ART-30_HEAD-1_PAGE-1.png  SE: Idle 8, Walk 8, Bite 8
    H1P2  ART-30_HEAD-1_PAGE-2.png  SE: Hurt 6, Death 8, ROFL 10
    H2P1  ART-30_HEAD-2_PAGE-1.png  NE: the rows of H1P1
    H2P2  ART-30_HEAD-2_PAGE-2.png  NE: the rows of H1P2
    H3P1  ART-30_HEAD-3_PAGE-1.png  S:  Hurt 6, Death 8, ROFL 10
    H5P1  ART-30_HEAD-5_PAGE-1.png  N:  Hurt 6, Death 8, ROFL 10
Their Bite plays as `attack`, Hurt as `flinch`, Death as `hurt`, ROFL as `rofl` -- its ten frames straight (frame 10 leads into
1), where E and W play their six there and back. S and N keep the stills' idle, walk and bite, bobbed. Every facing now draws
every row from its own view: S, SE, E, NE, N as drawn, SW, W, NW mirrored. Each page is scaled to the view beside it as
committed and toned to the side rows' colour (K30, TONE30), and with them the stills are scaled by the turnaround's Right still's
area rather than the side idle's height (build): S and N stood a quarter small beside the diagonals.
    python tools/hyena-sheet.py check      # dev/visions/hyena/: each page's cut (a colour a frame), every facing of every row, a lineup
"""
import os, sys, json, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'hyena_grok_1.webp')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
NAME = 'hyena_p2'
A = np.asarray(Image.open(os.path.join(SRC, 'hyena_grok_1.webp')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG = _v[np.argmax(_c)] * 4 + 2                          # the ground: the commonest colour
FW, FH, AX, AY = 96, 80, 48, 72
STAND = 34                                              # px of body from foot to the top of the head, before the outline (36 with it)

# the bands (x0, y0, x1, y1) and how many frames each holds; the rows sit right of the labels (x < 110), above their numbers
BANDS = {'front': ((335, 45, 418, 173), 1), 'back': ((588, 45, 662, 173), 1), 'right': ((430, 45, 585, 173), 1),
         'idle': ((118, 198, 1135, 276), 8), 'walk': ((118, 288, 1135, 360), 8),
         'attack': ((118, 456, 1135, 523), 8), 'hurt': ((118, 618, 1135, 680), 6),
         'death': ((118, 690, 1135, 752), 8)}

# the second sheet (09-30): its idle row (6, for the scale) and its ROFL row (7 figures; the first, two-headed, is dropped)
A2 = np.asarray(Image.open(os.path.join(SRC, 'hyena_grok_2.webp')).convert('RGB')).astype(np.int32)
_v, _c = np.unique(A2.reshape(-1, 3) // 4, axis=0, return_counts=True)
BG2 = _v[np.argmax(_c)] * 4 + 2
BANDS2 = {'idle': ((205, 185, 1135, 263), 6), 'rofl': ((205, 579, 1135, 646), 7)}
ROFL_LOOP = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2]                             # the figures (0 is the two-headed one), there and back

# ART-30 (10-15): the art desk's six pages, cut by their own row and number labels (tools/sheetrows.py). Per page: text boxes (each row's
# name, and each number strip the width of the page: a number lies wholly inside one, a paw that dips into it does not), and the rows --
# (the page's row name, band x0 y0 x1 y1, its number strip y0 y1, the numbers). Read off the pages; where a figure's paws reach its
# number strip (H1P2's Hurt 4 and Death 3-4, H2P2's Hurt 3, H3P1's Death 5-8) the strip starts under the paws, in the numbers' lower half.
ART30 = os.path.join(SRC, 'hyena', 'ART-30')
NUM = lambda k: [str(i + 1) for i in range(k)]
PAGES = {
    'H1P1': dict(file='ART-30_HEAD-1_PAGE-1.png',                                                       # SE: Idle 8, Walk 8, Bite 8
                 text=[(0, 125, 160, 185), (0, 325, 160, 385), (0, 550, 160, 612),
                       (155, 219, 1931, 249), (155, 440, 1931, 470), (155, 676, 1931, 707)],
                 rows=[('idle', (155, 55, 1931, 247), (222, 246), NUM(8)),
                       ('walk', (155, 280, 1931, 468), (443, 467), NUM(8)),
                       ('bite', (155, 505, 1931, 705), (679, 704), NUM(8))]),
    'H1P2': dict(file='ART-30_HEAD-1_PAGE-2.png',                                                       # SE: Hurt 6, Death 8, ROFL 10
                 text=[(0, 100, 180, 160), (0, 315, 180, 380), (0, 535, 145, 590),
                       (180, 215, 2140, 251), (180, 435, 2140, 476), (145, 656, 2140, 688)],
                 rows=[('hurt', (180, 55, 2140, 250), (226, 248), NUM(6)),
                       ('death', (180, 280, 2140, 474), (445, 473), NUM(8)),
                       ('rofl', (145, 500, 2140, 686), (659, 685), NUM(10))]),
    'H2P1': dict(file='ART-30_HEAD-2_PAGE-1.png',                                                       # NE: Idle 8, Walk 8, Bite 8
                 text=[(0, 125, 158, 186), (0, 328, 158, 388), (0, 552, 155, 612),
                       (155, 227, 1933, 256), (155, 458, 1933, 487), (155, 702, 1933, 732)],
                 rows=[('idle', (155, 50, 1933, 254), (230, 253), NUM(8)),
                       ('walk', (155, 265, 1933, 485), (461, 484), NUM(8)),
                       ('bite', (155, 490, 1933, 730), (705, 729), NUM(8))]),
    'H2P2': dict(file='ART-30_HEAD-2_PAGE-2.png',                                                       # NE: Hurt 6, Death 8, ROFL 10
                 text=[(0, 128, 165, 190), (0, 357, 162, 418), (0, 580, 154, 640),
                       (165, 253, 1942, 282), (160, 491, 1942, 520), (150, 722, 1942, 751)],
                 rows=[('hurt', (165, 70, 1942, 281), (261, 279), NUM(6)),
                       ('death', (160, 300, 1942, 518), (494, 517), NUM(8)),
                       ('rofl', (150, 545, 1942, 749), (725, 748), NUM(10))]),
    'H3P1': dict(file='ART-30_HEAD-3_PAGE-1.png',                                                       # S: Hurt 6, Death 8, ROFL 10
                 text=[(0, 100, 175, 160), (0, 312, 180, 375), (0, 520, 165, 580),
                       (190, 219, 2138, 250), (190, 443, 2138, 480), (180, 669, 2138, 700)],
                 rows=[('hurt', (190, 25, 2138, 248), (222, 247), NUM(6)),
                       ('death', (190, 250, 2138, 479), (452, 477), NUM(8)),
                       ('rofl', (180, 490, 2138, 698), (672, 697), NUM(10))]),
    'H5P1': dict(file='ART-30_HEAD-5_PAGE-1.png',                                                       # N: Hurt 6, Death 8, ROFL 10
                 text=[(0, 122, 178, 182), (0, 328, 180, 390), (0, 540, 170, 600),
                       (200, 220, 2137, 250), (200, 445, 2137, 478), (185, 653, 2137, 684)],
                 rows=[('hurt', (200, 30, 2137, 248), (223, 247), NUM(6)),
                       ('death', (200, 260, 2137, 476), (448, 475), NUM(8)),
                       ('rofl', (185, 490, 2137, 682), (656, 681), NUM(10))]),
}
ENGINE = {'idle': 'idle', 'walk': 'walk', 'bite': 'attack', 'hurt': 'flinch', 'death': 'hurt', 'rofl': 'rofl'}   # the page's row -> the sheet's
HEADS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1',), 'N': ('H5P1',)}
FLOOR = ('hurt', 'death')                    # rows that start standing: the row's ground is its first frame's feet (a cringe or a body lying
                                             # nearer the eye reaches lower on the page); the others stand on the row's lowest point
# the scale, page px a game px. No turnaround on the pages: each page's standing hyena to the view beside it as committed, by the square
# root of its filled area (height lies: the NE idle holds its head up where the SE idle and the side's drop theirs). The side idle stands
# 64.3 px of sheet 1 (sqrt area 59.5) at 1.890, so 31.5 at game size. HEAD 1's idle 121.6 -> 3.86 (its height agrees: 129.5 to 34, 3.81);
# HEAD 2's idle 120.5 -> 3.83 (it stands 41.5, its head up: the front and back stand 43). HEAD 3's Hurt 1 (the front, standing: 173 px,
# sqrt area 113.2) to the turnaround's Front still at its game size (43.6, 28.4): 3.97 by height, 3.99 by area -> 3.98; HEAD 5's Hurt 1
# and 6 (165, 104.5) to the Back still (43.2, 26.2): 3.82, 3.99 -> 3.90. Four pages at 3.8-4.0: the art desk drew them at one scale,
# which says the stills' scale by area (build) is the right one. A page 2 by its Death 1 (standing, the idle's pose) against its page 1's
# idle: HEAD 1's drawn 8% bigger (area 131.8 to 121.6, height 140 to 129.5), HEAD 2's 2% (122.1 to 120.5, 165 to 158.8).
K30 = {'H1P1': 3.86, 'H2P1': 3.83, 'H3P1': 3.98, 'H5P1': 3.90}
K30.update({'H1P2': K30['H1P1'] * 1.08, 'H2P2': K30['H2P1'] * 1.02})
# the colour, page by page, to the side rows' (his look's): the art desk drew a warmer, stronger, brighter hyena, the more so on the later
# pages. The medians of the coloured pixels (saturation over 0.2), hue / saturation / value: the side's idle, walk and bite 32.6 / 0.486 /
# 0.443; H1P1 30.0 / 0.537 / 0.502, H1P2 29.1 / 0.590 / 0.529, H2P1 28.5 / 0.563 / 0.518, H2P2 26.3 / 0.657 / 0.596, H3P1 26.4 / 0.677 /
# 0.596, H5P1 25.7 / 0.661 / 0.565. Each page: the hue turned, the saturation and the value times a factor, to meet the side's
# (a per-channel tone moves the spots and the outline unevenly -- GreyFang's seat, 10-14: match saturation instead)
TONE30 = {'H1P1': (2.6, 0.907, 0.883), 'H1P2': (3.6, 0.825, 0.837), 'H2P1': (4.1, 0.864, 0.856),
          'H2P2': (6.3, 0.740, 0.743), 'H3P1': (6.2, 0.719, 0.743), 'H5P1': (6.9, 0.736, 0.785)}


def toned(im, t):
    """an RGBA cut in HSV: its hue turned t[0] degrees, its saturation times t[1], its value times t[2]"""
    a = np.asarray(im).astype(float)
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = (np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60 + t[0]) % 360
    s = np.clip(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0) * t[1], 0, 1)
    v = np.clip(mx * t[2], 0, 1)
    cc = v * s
    x = cc * (1 - np.abs((h / 60) % 2 - 1))
    sec = (h // 60).astype(int) % 6
    z = np.zeros_like(cc)
    out = np.select([sec[..., None] == k for k in range(6)],
                    [np.stack(p, -1) for p in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))]) + (v - cc)[..., None]
    a[..., :3] = np.clip(out * 255, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')


def frames_in(name, bands=None, A=A, BG=BG):
    """the n figures in a row's band, left to right: (cut RGBA array over the row's common window, torso-ready, the figure's own height)."""
    (x0, y0, x1, y1), n = (bands or BANDS)[name]
    c = A[y0:y1, x0:x1]
    m0 = np.abs(c - BG).sum(-1) > 45                                       # the figure's pixels
    m = np.pad(m0, 6)
    m = ndimage.binary_closing(m, iterations=2)[6:-6, 6:-6]                # (to group the pieces: a tail, a paw, a gap)
    lab, k = ndimage.label(m)
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        if area < 1500:                                                    # a number, a label's word, a speck
            continue
        comps.append({'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop, 'area': area})
    comps.sort(key=lambda d: d['x0'])
    groups = []
    for d in comps:                                                        # pieces that share columns are one figure
        if groups and d['x0'] <= groups[-1]['x1'] + 6:
            g = groups[-1]
            g['ids'].append(d['id']); g['x1'] = max(g['x1'], d['x1']); g['y0'] = min(g['y0'], d['y0']); g['y1'] = max(g['y1'], d['y1']); g['area'] += d['area']
        else:
            groups.append({'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'y0': d['y0'], 'y1': d['y1'], 'area': d['area']})
    groups = sorted(sorted(groups, key=lambda g: -g['area'])[:n], key=lambda g: g['x0'])
    assert len(groups) == n, (name, len(groups))
    ty, by = min(g['y0'] for g in groups), max(g['y1'] for g in groups)      # the row's own window, top to ground
    out = []
    for g in groups:
        mm = np.isin(lab, g['ids']) & m0
        mm = ndimage.binary_fill_holes(mm)
        cc = c[ty:by, g['x0']:g['x1']]
        am = mm[ty:by, g['x0']:g['x1']]
        img = Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')
        out.append({'img': img, 'h': g['y1'] - g['y0'], 'top': g['y0'] - ty})
    return out


def fit(img, scale):
    """one scale: premultiplied box down, a 1-px margin for the outline, snapped to the palette."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a tail and a raised head are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 75 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


CLIPPED = []


def place(a, x_ref, tag='', up=0):
    """the cut onto the frame: its torso on AX, the cut's bottom (the row's ground, outline and all) on AY -- or `up` px above it."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - (a.shape[0] - 1) - up
    h, w = a.shape[:2]
    if ox < 0 or oy < 0 or ox + w > FW or oy + h > FH:
        rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
        if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
            CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def breathe(fr):
    """the chest rises a pixel (the legs stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] - 1:mid] = fr[rows[0]:mid + 1]
    return o


def mirror(seq):
    """west of the drawn east: a flip, then a pixel back so the torso stays on the anchor column."""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def heads(check=False):
    """ART-30's pages -> {view: {sheet row: [frame, ...]}}, each frame placed as the side rows are: its torso on AX, its feet off the
    row's ground by what the page draws (`FLOOR`), at its page's scale."""
    views = {v: {} for v in HEADS}
    for v, pages in HEADS.items():
        for L in pages:
            s = PAGES[L]
            over = [] if check else None
            cuts = SR.cut_sheet(os.path.join(ART30, s['file']), s, overlay=over, tag=L)
            if check:
                d = os.path.join(ROOT, 'dev', 'visions', 'hyena'); os.makedirs(d, exist_ok=True)
                over[0].save(os.path.join(d, 'cut-%s.png' % L))
            k = K30[L]
            for row, frs in cuts.items():
                floor = frs[0][2][3] if row in FLOOR else max(b[3] for _, _, b in frs)
                seq = []
                for nm, im, box in frs:
                    a = fit(toned(im, TONE30[L]), k)
                    a = a[:np.where(a[..., 3].any(axis=1))[0][-1] + 1]            # (its lowest opaque row: the feet's outline)
                    seq.append(place(a, torso_x(a), '%s-%s%s' % (L, row, nm), up=int(round((floor - box[3]) / k))))
                views[v][ENGINE[row]] = seq
    return views


def build(check=False):
    rows = {k: frames_in(k) for k in BANDS}
    stand = np.mean([d['h'] for d in rows['idle']]) / STAND                 # the side rows, by the idle row's height
    # the turnaround's own scale, by its Right still: the side rows' hyena drawn at the turnaround's size. By area (10-15), its head up
    # where the idle's is low: by height the stills came out a quarter small beside the diagonals (the Front still is as tall as the
    # Right one and 0.89 of its area; matched by height it stood 34 to the side idle's 34 and 0.70 of its area). See ART-30's K30.
    sq = lambda d: np.sqrt(ndimage.binary_fill_holes(np.asarray(d['img'])[..., 3] > 0).sum())
    stills = stand * sq(rows['right'][0]) / np.mean([sq(d) for d in rows['idle']])
    print('  side scale %.3f (idle %.1f px of source), still scale %.3f' % (stand, stand * STAND, stills))

    def side(k):
        return [place(a, torso_x(a), '%s%d' % (k, i)) for i, a in enumerate(fit(d['img'], stand) for d in rows[k])]
    idle_r, walk_r, atk_r, hurt_r, flinch_r = side('idle'), side('walk'), side('attack'), side('death'), side('hurt')
    fa, ba = fit(rows['front'][0]['img'], stills), fit(rows['back'][0]['img'], stills)
    fS, fN = place(fa, torso_x(fa), 'front'), place(ba, torso_x(ba), 'back')
    idle_l, walk_l, atk_l, hurt_l, flinch_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(hurt_r), mirror(flinch_r)
    rows2 = {k: frames_in(k, BANDS2, A2, BG2) for k in BANDS2}
    stand2 = np.mean([d['h'] for d in rows2['idle']]) / STAND
    print('  second sheet: side scale %.3f (idle %.1f px of source)' % (stand2, stand2 * STAND))
    cuts = [place(a, torso_x(a), 'rofl%d' % i) for i, a in enumerate(fit(d['img'], stand2) for d in rows2['rofl'])]
    rofl_r = [cuts[i] for i in ROFL_LOOP]
    rofl_l = mirror(rofl_r)
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    dip = [0, 0, 1, 2, 3, 2, 1, 0]

    hd = heads(check)                                    # ART-30: SE, NE (every row), S and N (flinch, hurt, rofl)
    side_r = {'idle': idle_r, 'walk': walk_r, 'attack': atk_r, 'hurt': hurt_r, 'flinch': flinch_r, 'rofl': rofl_r}
    side_l = {'idle': idle_l, 'walk': walk_l, 'attack': atk_l, 'hurt': hurt_l, 'flinch': flinch_l, 'rofl': rofl_l}
    front = {'idle': [fS] * 4 + [breathe(fS)] * 4, 'walk': [shift(fS, 0, -(i % 2)) for i in range(8)],
             'attack': [shift(fS, 0, d) for d in dip], **hd['S']}
    back = {'idle': [fN] * 4 + [breathe(fN)] * 4, 'walk': [shift(fN, 0, -(i % 2)) for i in range(8)],
            'attack': [shift(fN, 0, -d) for d in dip], **hd['N']}
    # facings S, SW, W, NW, N, NE, E, SE (deep16/js/sprites.js S.FACINGS). RULED 10-14, five drawn views: S, SE (SW mirrored), E (W
    # mirrored), NE (NW mirrored), N. S and N keep the turnaround's stills, bobbed, for idle, walk and attack (ART-30 drew them no rows)
    per = [front, {r: mirror(fs) for r, fs in hd['SE'].items()}, side_l, {r: mirror(fs) for r, fs in hd['NE'].items()},
           back, hd['NE'], side_r, hd['SE']]
    frames = {r: [p[r] for p in per] for r in ('idle', 'walk', 'attack', 'hurt', 'flinch', 'rofl')}
    for r, fs in frames.items():
        counts = [len(x) for x in fs]
        assert len(set(counts)) == 1, (r, counts)       # a row plays one frame count in every facing
    for t in CLIPPED:
        print('  CLIPPED', t)
    return frames


def write(frames):
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(meta_p))
    for k, v in {'idle': 5, 'walk': 10, 'attack': 12, 'hurt': 8, 'flinch': 12, 'rofl': 8}.items():
        meta['anims'][k]['fps'] = v
    meta['source'] = ('generated by Griz (2026-09-29, one sheet; the rofl row from his second, 2026-09-30) and the art desk (2026-10-15, '
                      'ART-30: the SE and NE views of every row, the front and back of the flinch, the fall and the rofl), cut and snapped by '
                      'tools/hyena-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)


VIEWS5 = (0, 7, 6, 5, 4)                     # the five drawn views, S SE E NE N


def preview(frames):
    """every anim's frames for the five drawn views (S, SE, E, NE, N) side by side, 2x, on a mid-grey ground (one row of cells per anim)."""
    allf = [fr for a in frames.values() for f in VIEWS5 for fr in a[f]]
    cols = np.where(np.any([fr[..., 3].any(axis=0) for fr in allf], axis=0))[0]
    rws = np.where(np.any([fr[..., 3].any(axis=1) for fr in allf], axis=0))[0]
    cx0, cx1 = max(0, cols[0] - 2), min(FW, cols[-1] + 3)
    cy0, cy1 = max(0, rws[0] - 2), min(FH, AY + 4)
    cw, ch = cx1 - cx0, cy1 - cy0
    print('  preview window x %d-%d y %d-%d (content spans x %d-%d, y %d-%d)' % (cx0, cx1, cy0, cy1, cols[0], cols[-1], rws[0], rws[-1]))
    S, GAP = 2, 8
    nmax = max(len(a[0]) for a in frames.values())
    W = len(VIEWS5) * nmax * cw * S + (len(VIEWS5) - 1) * GAP * S + 2 * GAP
    H = len(frames) * (ch * S + GAP)
    img = np.zeros((H, W, 3), dtype=np.uint8); img[:] = (112, 112, 112)
    for r, (anim, a) in enumerate(frames.items()):
        x = GAP
        for f in VIEWS5:
            for i, fr in enumerate(a[f]):
                cell = fr[cy0:cy1, cx0:cx1]
                big = np.repeat(np.repeat(cell, S, 0), S, 1)
                y = r * (ch * S + GAP)
                sub = img[y:y + ch * S, x + i * cw * S:x + (i + 1) * cw * S]
                al = big[..., 3:4] > 0
                sub[:] = np.where(al, big[..., :3], sub)
                img[y, x + i * cw * S:x + (i + 1) * cw * S] = (90, 90, 90)              # a cell's top edge
                img[y + (AY - cy0 + 1) * S, x + i * cw * S:x + (i + 1) * cw * S] = (160, 60, 60)   # the ground line, under the anchor row
            x += nmax * cw * S + GAP * S
    out = os.path.join(ROOT, 'dev', 'shots', 'hyena-cuts.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    Image.fromarray(img, 'RGB').save(out)
    print('  wrote', out, img.shape[1], 'x', img.shape[0])


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames):
    """dev/visions/hyena/facings-<row>.png: every facing of every row, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the foot's
    line drawn), and lineup.png: idle frame 1 in all eight facings beside the gnoll's, 4x"""
    d = os.path.join(ROOT, 'dev', 'visions', 'hyena'); os.makedirs(d, exist_ok=True)
    for name, per in frames.items():
        n = len(per[0])
        cv = Image.new('RGBA', (FW * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))   # (under the frames: a body lying
            dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))                                 # nearer the eye reaches past it)
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (FW + 4), f * FH))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % name))
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'gnoll_p2.json')))
    an = m['anims']['idle']
    gn = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', 'gnoll_p2.png')).convert('RGBA'))
    figs = [(frames['idle'][f][0], AY) for f in range(8)] + [(gn[an['y'] + 6 * an['fh']:an['y'] + 7 * an['fh'], 0:an['fw']], an['ay'])]
    top = max(ay for _, ay in figs)
    W, H = sum(a.shape[1] for a, _ in figs), top + max(a.shape[0] - ay for a, ay in figs)
    cv = np.zeros((H, W, 4), np.uint8); cv[..., :3] = (70, 74, 70); cv[..., 3] = 255
    x = 0
    for a, ay in figs:
        sub = cv[top - ay:top - ay + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[..., :3] = (a[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        x += a.shape[1]
    cv[top + 1, :, :3] = (200, 60, 60)
    Image.fromarray(cv).resize((W * 4, H * 4), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else ''
    fr = build(check=arg == 'check')
    if arg == 'preview':
        preview(fr)
    elif arg == 'check':                                 # the cut overlays, every facing of every row, the lineup (dev/visions/hyena/)
        facings(fr)
    else:
        write(fr)
